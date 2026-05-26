const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const { sendWhatsappMessage } = require("../services/whatsapp");

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

const dataPath = process.env.DATA_PATH || path.join(__dirname, "..");
const uploadsDir = path.join(dataPath, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage });

// Get all products
router.get("/products", (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM store_products ORDER BY category, name").all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
router.post("/products", upload.single("image"), (req, res) => {
  try {
    const { name, category, price_pesos, price_points, price_pesos_mixed, price_points_mixed, stock } = req.body;
    
    if (!name || !category || price_pesos === undefined || price_points === undefined) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Missing required fields" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!imageUrl) {
      return res.status(400).json({ error: "Image is required" });
    }

    const insert = db.prepare(`
      INSERT INTO store_products (name, category, price_pesos, price_points, price_pesos_mixed, price_points_mixed, image_url, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = insert.run(
      name, category, 
      parseFloat(price_pesos) || 0, parseInt(price_points) || 0, 
      parseFloat(price_pesos_mixed) || 0, parseInt(price_points_mixed) || 0,
      imageUrl, parseInt(stock) || 10
    );
    
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete("/products/:id", (req, res) => {
  try {
    const id = req.params.id;
    const product = db.prepare("SELECT image_url FROM store_products WHERE id = ?").get(id);
    
    if (product) {
      const filename = path.basename(product.image_url);
      const filepath = path.join(__dirname, "..", "uploads", filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      db.prepare("DELETE FROM store_products WHERE id = ?").run(id);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit product
router.put("/products/:id", upload.single("image"), (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, price_pesos, price_points, price_pesos_mixed, price_points_mixed, stock } = req.body;
    
    if (!name || !category || price_pesos === undefined || price_points === undefined) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Missing required fields" });
    }

    const currentProduct = db.prepare("SELECT image_url FROM store_products WHERE id = ?").get(id);
    if (!currentProduct) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Product not found" });
    }

    let imageUrl = currentProduct.image_url;
    
    if (req.file) {
      // Remove old image
      const oldFilename = path.basename(currentProduct.image_url);
      const oldFilepath = path.join(__dirname, "..", "uploads", oldFilename);
      if (fs.existsSync(oldFilepath)) fs.unlinkSync(oldFilepath);
      
      // Set new image
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const update = db.prepare(`
      UPDATE store_products 
      SET name = ?, category = ?, price_pesos = ?, price_points = ?, price_pesos_mixed = ?, price_points_mixed = ?, image_url = ?, stock = ?
      WHERE id = ?
    `);
    
    update.run(
      name, category, 
      parseFloat(price_pesos) || 0, parseInt(price_points) || 0,
      parseFloat(price_pesos_mixed) || 0, parseInt(price_points_mixed) || 0,
      imageUrl, parseInt(stock) || 0, id
    );
    res.json({ success: true });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message });
  }
});

// Create an order (exchange points for product)
router.post("/orders", (req, res) => {
  const { producer_id, product_id, payment_type = "full_points" } = req.body;
  
  if (!producer_id || !product_id) {
    return res.status(400).json({ error: "Missing producer or product ID" });
  }

  try {
    db.transaction(() => {
      // Get product details
      const product = db.prepare("SELECT price_points, price_points_mixed, stock FROM store_products WHERE id = ?").get(product_id);
      if (!product) throw new Error("Producto no encontrado");
      if (product.stock <= 0) throw new Error("Sin stock disponible");

      const pointsRequired = payment_type === "mixed" ? product.price_points_mixed : product.price_points;

      // Verify points for producer
      const year = new Date().getFullYear();
      const pointsRow = db.prepare(`
        SELECT SUM(amount) as total_amount FROM collections WHERE producer_id = ? AND year = ?
      `).get(producer_id, year);
      
      const totalPointsEarned = Math.floor((pointsRow.total_amount || 0) * 0.0001);
      
      const spentRow = db.prepare(`
        SELECT SUM(points_spent) as spent FROM store_orders WHERE producer_id = ?
      `).get(producer_id);
      
      const totalSpent = spentRow.spent || 0;
      const availablePoints = totalPointsEarned - totalSpent;

      if (availablePoints < pointsRequired) {
        throw new Error("Puntos insuficientes");
      }

      // Deduct stock and insert order
      db.prepare("UPDATE store_products SET stock = stock - 1 WHERE id = ?").run(product_id);
      
      const insert = db.prepare(`
        INSERT INTO store_orders (producer_id, product_id, points_spent, payment_type, pesos_spent)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      // For full_points, pesos_spent is 0
      insert.run(producer_id, product_id, pointsRequired, payment_type, 0);

      // Send WhatsApp receipt
      const producer = db.prepare("SELECT name, phone FROM producers WHERE id = ?").get(producer_id);
      if (producer && producer.phone) {
        let firstName = producer.name.includes(",") ? producer.name.split(",")[1].trim().split(" ")[0] : producer.name.split(" ")[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        
        const message = `¡Hola ${firstName}! 🛍️\n\nRegistramos tu canje por *${product.name}*.\nSe descontaron ${pointsRequired} puntos.\nTu nuevo saldo es de ${availablePoints - pointsRequired} puntos.\n\n¡Te avisaremos cuando esté listo para retirar!`;
        
        // Non-blocking async
        sendWhatsappMessage(producer.phone, message).catch(err => console.error("Error sending WA receipt:", err.message));
      }
      
    })();
    
    res.json({ success: true, message: "Canje realizado con éxito" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all orders
router.get("/orders", (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT 
        o.id, 
        p.name as producer_name, 
        sp.name as product_name, 
        sp.image_url,
        o.points_spent, 
        o.payment_type,
        o.pesos_spent,
        o.status, 
        o.created_at
      FROM store_orders o
      JOIN producers p ON o.producer_id = p.id
      JOIN store_products sp ON o.product_id = sp.id
      ORDER BY o.created_at DESC
    `).all();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get producer collections breakdown
router.get("/producer-collections/:id", (req, res) => {
  try {
    const producerId = req.params.id;
    
    // Get all collections for this producer with company names
    const collections = db.prepare(`
      SELECT c.amount, c.year, c.month, comp.name as company_name 
      FROM collections c
      JOIN companies comp ON c.company_id = comp.id
      WHERE c.producer_id = ?
      ORDER BY c.year DESC, c.month DESC
    `).all(producerId);

    // Group by month
    const grouped = {};
    collections.forEach(c => {
      const key = `${c.month} ${c.year}`;
      if (!grouped[key]) {
        grouped[key] = {
          month: c.month,
          year: c.year,
          total_pesos: 0,
          total_points: 0,
          companies: []
        };
      }
      const points = Math.floor(c.amount * 0.0001);
      grouped[key].companies.push({ name: c.company_name, amount: c.amount, points });
      grouped[key].total_pesos += c.amount;
      grouped[key].total_points += points;
    });

    const result = Object.values(grouped).filter(g => g.total_points > 0);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get producer history
router.get("/producer-history/:id", (req, res) => {
  try {
    const producerId = req.params.id;
    
    // Get all points earned (incomes)
    const collections = db.prepare(`
      SELECT c.amount, c.year, c.month, comp.name as company_name
      FROM collections c
      LEFT JOIN companies comp ON c.company_id = comp.id
      WHERE c.producer_id = ?
    `).all(producerId);
    
    const monthMap = { "Enero": "01", "Febrero": "02", "Marzo": "03", "Abril": "04", "Mayo": "05", "Junio": "06", "Julio": "07", "Agosto": "08", "Septiembre": "09", "Octubre": "10", "Noviembre": "11", "Diciembre": "12" };
    
    const incomes = collections.map(c => {
      const monthNum = monthMap[c.month] || "01";
      const compName = c.company_name ? c.company_name.toUpperCase() : 'COMPAÑÍA';
      return {
        id: `inc_${c.year}_${c.month}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date(`${c.year}-${monthNum}-01T12:00:00Z`).toISOString(),
        type: 'income',
        description: `Puntos ${compName} (${c.month}/${c.year})`,
        points: Math.floor((c.amount || 0) * 0.0001)
      };
    }).filter(i => i.points > 0);

    // Get all orders (expenses)
    const orders = db.prepare(`
      SELECT o.id, o.created_at, sp.name as product_name, o.points_spent, o.payment_type, o.status
      FROM store_orders o
      JOIN store_products sp ON o.product_id = sp.id
      WHERE o.producer_id = ? AND o.status != 'pending_payment'
    `).all(producerId);

    const expenses = orders.map(o => ({
      id: `exp_${o.id}`,
      date: o.created_at,
      type: 'expense',
      description: `Canje: ${o.product_name}`,
      points: o.points_spent,
      payment_type: o.payment_type,
      status: o.status
    }));

    // Combine and sort chronologically
    const history = [...incomes, ...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let balance = 0;
    const historyWithBalance = history.map(item => {
      if (item.type === 'income') balance += item.points;
      else balance -= item.points;
      return { ...item, balance };
    });

    // Reverse to show newest first
    res.json(historyWithBalance.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark order as delivered
router.put("/orders/:id/deliver", (req, res) => {
  try {
    const id = req.params.id;
    db.prepare("UPDATE store_orders SET status = 'delivered' WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Mercado Pago Checkout Preference
router.post("/checkout", async (req, res) => {
  const { product_id, producer_id, payment_type = "full_mp", source = "desktop" } = req.body;
  
  if (!product_id || !producer_id) {
    return res.status(400).json({ error: "Missing producer or product ID" });
  }

  try {
    const product = db.prepare("SELECT id, name, price_pesos, price_points, price_pesos_mixed, price_points_mixed, stock FROM store_products WHERE id = ?").get(product_id);
    if (!product) throw new Error("Producto no encontrado");
    if (product.stock <= 0) throw new Error("Sin stock disponible");

    const priceToCharge = payment_type === "mixed" ? (product.price_pesos_mixed || 0) : (product.price_pesos || 0);
    const itemTitle = payment_type === "mixed" ? `${product.name} (Pago Mixto)` : product.name;

    // Create pending order
    const insert = db.prepare(`
      INSERT INTO store_orders (producer_id, product_id, points_spent, payment_type, pesos_spent, status)
      VALUES (?, ?, ?, ?, ?, 'pending_payment')
    `);
    
    const pointsSpent = payment_type === "mixed" ? (product.price_points_mixed || 0) : 0;
    const info = insert.run(producer_id, product_id, pointsSpent, payment_type, priceToCharge);
    const orderId = info.lastInsertRowid;

    const preference = new Preference(mpClient);
    const host = req.get('host');
    
    let baseUrl;
    if (host.includes('localhost')) {
      baseUrl = source === 'mobile' ? 'http://localhost:5181' : 'http://localhost:5180';
    } else {
      baseUrl = source === 'mobile' ? `https://${host}` : `https://${host}/admin`;
    }
    
    const result = await preference.create({
      body: {
        items: [
          {
            id: product.id.toString(),
            title: itemTitle,
            quantity: 1,
            unit_price: Number(priceToCharge),
            currency_id: "ARS"
          }
        ],
        back_urls: {
          success: `${baseUrl}/tienda?status=success&order_id=${orderId}`,
          failure: `${baseUrl}/tienda?status=failure`,
          pending: `${baseUrl}/tienda?status=pending`
        },
        auto_return: "approved",
        external_reference: `${orderId}`
      }
    });

    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error("Error creating Mercado Pago preference:", error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm Mercado Pago payment
router.put("/orders/:id/confirm-mp", (req, res) => {
  try {
    const id = req.params.id;
    const order = db.prepare("SELECT * FROM store_orders WHERE id = ?").get(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    if (order.status === 'pending_payment') {
      // Mark as pending (paid, waiting for delivery)
      db.prepare("UPDATE store_orders SET status = 'pending' WHERE id = ?").run(id);
      
      // Send WhatsApp receipt
      const producer = db.prepare("SELECT name, phone FROM producers WHERE id = ?").get(order.producer_id);
      const product = db.prepare("SELECT name FROM store_products WHERE id = ?").get(order.product_id);
      
      if (producer && producer.phone && product) {
        let firstName = producer.name.includes(",") ? producer.name.split(",")[1].trim().split(" ")[0] : producer.name.split(" ")[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        
        let paymentMsg = `Se abonaron $${order.pesos_spent}`;
        if (order.payment_type === 'mixed') paymentMsg += ` y ${order.points_spent} puntos.`;
        else paymentMsg += `.`;

        const message = `¡Hola ${firstName}! 🛍️\n\nConfirmamos tu pago por *${product.name}*.\n${paymentMsg}\n\n¡Te avisaremos cuando esté listo para retirar!`;
        
        sendWhatsappMessage(producer.phone, message).catch(err => console.error("Error sending WA receipt:", err.message));
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
