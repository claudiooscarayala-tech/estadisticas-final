const db = require("./db");
const fs = require("fs");
const path = require("path");

function migrate() {
  console.log("Iniciando migración para Tienda COA...");

  db.exec(`
    CREATE TABLE IF NOT EXISTS store_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price_pesos REAL NOT NULL,
      price_points INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      stock INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS store_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      points_spent INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(producer_id) REFERENCES producers(id),
      FOREIGN KEY(product_id) REFERENCES store_products(id)
    );
  `);

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log("Directorio 'uploads' creado.");
  }

  console.log("Migración de Tienda COA completada exitosamente.");
}

migrate();
