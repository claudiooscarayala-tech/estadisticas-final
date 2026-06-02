const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Ejecutar migración de productores (one-time load)
try {
  const migrateProducers = require("./scripts/migrate_producers");
  migrateProducers();
} catch (err) {
  console.error("Error running producer migration:", err);
}

const app = express();
app.use(cors());
app.use(express.json());

const authMiddleware = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const producersRoutes = require("./routes/producers");
const companiesRoutes = require("./routes/companies");
const collectionsRoutes = require("./routes/collections");
const reportsRoutes = require("./routes/reports");
const deudaRoutes = require("./routes/deuda");
const pointsRoutes = require("./routes/points");
const storeRoutes = require("./routes/store");
const birthdaysRoutes = require("./routes/birthdays");
const vencimientosRoutes = require("./routes/vencimientos");
const { initCron } = require("./services/whatsapp");

// --- Public Endpoints ---
app.use("/api/auth", authRoutes);

// --- Protected Endpoints ---
app.use("/api/producers", authMiddleware, producersRoutes);
app.use("/api/companies", authMiddleware, companiesRoutes);
app.use("/api/collections", authMiddleware, collectionsRoutes);
app.use("/api/reports", authMiddleware, reportsRoutes);
app.use("/api/deuda", authMiddleware, deudaRoutes);
app.use("/api/points", authMiddleware, pointsRoutes);
app.use("/api/store", authMiddleware, storeRoutes);
app.use("/api/birthdays", authMiddleware, birthdaysRoutes);
app.use("/api/vencimientos", authMiddleware, vencimientosRoutes);

// Initialize Cron Jobs
initCron();

const PORT = process.env.PORT || 3001;
const dataPath = process.env.DATA_PATH || __dirname;
const uploadsPath = path.join(dataPath, "uploads");

// Serve uploaded images statically, fallback to production if not found locally
app.use("/uploads", (req, res, next) => {
  const localFile = path.join(uploadsPath, req.path);
  const fs = require("fs");
  if (fs.existsSync(localFile) && fs.lstatSync(localFile).isFile()) {
    res.sendFile(localFile);
  } else {
    res.redirect(`https://estadisticas-final-production.up.railway.app/uploads${req.path}`);
  }
});

// Serve PC frontend under /admin
app.use("/admin", express.static(path.join(__dirname, "../frontend/dist")));

// Serve Mobile frontend under /
app.use(express.static(path.join(__dirname, "../mobile-frontend/dist")));

// FALLBACK: Serve assets for BOTH frontends in case they request /assets directly
app.use("/assets", express.static(path.join(__dirname, "../frontend/dist/assets")));
app.use("/assets", express.static(path.join(__dirname, "../mobile-frontend/dist/assets")));
app.use("/assets", (req, res) => res.status(404).send("Not found"));

// Handle React Router logic for PC frontend
// Ruta de migración de emergencia
app.get("/api/migrate-db", (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");
    let logs = [];
    let backupPath = path.join(__dirname, '..', 'products-backup.json');
    if (!fs.existsSync(backupPath)) {
      backupPath = path.join(__dirname, '..', '..', 'products-backup.json');
    }
    
    if (!fs.existsSync(backupPath)) {
      return res.json({ success: false, error: "No backup file found at " + backupPath, logs });
    }
    logs.push("Encontrado backup en: " + backupPath);
    
    const products = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
    const insert = db.prepare(`
      INSERT OR IGNORE INTO store_products 
      (id, name, category, price_pesos, price_points, price_pesos_mixed, price_points_mixed, stock, supplier, image_url, image_url_2, image_url_3) 
      VALUES (@id, @name, @category, @price_pesos, @price_points, @price_pesos_mixed, @price_points_mixed, @stock, @supplier, @image_url, @image_url_2, @image_url_3)
    `);
    
    let count = 0;
    for (const p of products) {
      try {
        insert.run(p);
        count++;
      } catch (err) {
        logs.push("Error inserting " + p.name + ": " + err.message);
      }
    }
    logs.push("Migrados " + count + " productos.");
    res.json({ success: true, count, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// Handle React Router logic for Mobile frontend
app.get("*", (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, "../mobile-frontend/dist", "index.html"));
});

// DEBUG ENDPOINT
app.get("/api/debug-uploads", (req, res) => {
  try {
    const fs = require('fs');
    const dataP = process.env.DATA_PATH || 'NOT SET';
    const dbP = process.env.DB_PATH || 'NOT SET';
    const upPath = path.join(process.env.DATA_PATH || __dirname, "uploads");
    
    let files = [];
    if (fs.existsSync(upPath)) {
      files = fs.readdirSync(upPath);
    }
    
    res.json({
      DATA_PATH: dataP,
      DB_PATH: dbP,
      uploadsPath: upPath,
      exists: fs.existsSync(upPath),
      files: files
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DUMP DB ENDPOINT (To easily backup production database to local machine)
app.get("/api/download-db", (req, res) => {
  try {
    const dbPath = process.env.DB_PATH || path.join(__dirname, "database.sqlite");
    if (require("fs").existsSync(dbPath)) {
      res.download(dbPath, "database.sqlite");
    } else {
      res.status(404).send("Database file not found");
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
