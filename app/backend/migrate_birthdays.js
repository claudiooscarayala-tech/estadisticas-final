const db = require("./db");

console.log("Creando tabla birthday_logs...");
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS birthday_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producer_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      FOREIGN KEY(producer_id) REFERENCES producers(id)
    );
  `);
  console.log("✅ Tabla birthday_logs creada correctamente.");
} catch (error) {
  console.error("❌ Error creando tabla:", error.message);
}
