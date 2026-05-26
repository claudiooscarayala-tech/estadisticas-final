const db = require("./db");

console.log("Adding mixed payment columns to store_products...");

try {
  // Add columns if they don't exist
  // By default, old products will have 0 or null for mixed prices, so the admin should update them.
  const columns = db.prepare("PRAGMA table_info(store_products)").all();
  const columnNames = columns.map(c => c.name);

  if (!columnNames.includes("price_pesos_mixed")) {
    db.prepare("ALTER TABLE store_products ADD COLUMN price_pesos_mixed REAL DEFAULT 0").run();
  }
  
  if (!columnNames.includes("price_points_mixed")) {
    db.prepare("ALTER TABLE store_products ADD COLUMN price_points_mixed INTEGER DEFAULT 0").run();
  }

  console.log("Migration successful!");
} catch (error) {
  console.error("Migration failed:", error);
}
