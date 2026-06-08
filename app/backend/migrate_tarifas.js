const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

try {
  // Check if columns exist
  const tableInfo = db.pragma('table_info(store_products)');
  const hasBaseCost = tableInfo.some(col => col.name === 'base_cost');
  const hasTarifa = tableInfo.some(col => col.name === 'tarifa');

  if (!hasBaseCost) {
    db.exec("ALTER TABLE store_products ADD COLUMN base_cost REAL DEFAULT 0");
    console.log("Added base_cost column");
  }

  if (!hasTarifa) {
    db.exec("ALTER TABLE store_products ADD COLUMN tarifa INTEGER DEFAULT 1");
    console.log("Added tarifa column");
  }

  // Update existing data
  const info = db.prepare(`
    UPDATE store_products
    SET tarifa = 1, base_cost = ROUND(price_pesos / 2.2, 2)
    WHERE base_cost = 0 OR base_cost IS NULL
  `).run();

  console.log(`Updated ${info.changes} existing products to Tarifa 1 and calculated base_cost.`);
} catch (error) {
  console.error("Migration failed:", error);
} finally {
  db.close();
}
