const Database = require("better-sqlite3");
const xlsx = require("xlsx");
const path = require("path");

const dbPath = process.env.DB_PATH || path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

console.log("Starting emergency restore of companies and collections...");

// 1. Create tables if they are missing
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producer_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY(producer_id) REFERENCES producers(id),
    FOREIGN KEY(company_id) REFERENCES companies(id)
  );
`);

// Check if collections are already populated
const existing = db.prepare("SELECT count(*) as c FROM collections").get().c;
if (existing > 0) {
  console.log("Collections already exist. Aborting restore to avoid duplicates.");
  module.exports = true;
} else {
  // Prepared statements
const insertCompany = db.prepare("INSERT OR IGNORE INTO companies (name) VALUES (?)");
const getCompany = db.prepare("SELECT id FROM companies WHERE name = ?");

const insertCollection = db.prepare(
  "INSERT INTO collections (producer_id, company_id, month, year, amount) VALUES (?, ?, ?, ?, ?)"
);
const getProducer = db.prepare("SELECT id FROM producers WHERE name = ? OR name = ?");

// Load Data
const excelPath = path.join(__dirname, "datos.xlsx");
if (!require("fs").existsSync(excelPath)) {
  console.error("datos.xlsx not found!");
  process.exit(1);
}

const workbook = xlsx.readFile(excelPath);
const EXCLUDED_COLS = ["PRODUCTOR", "MAIL", "TOTAL", "MES", "__EMPTY"];

let collectionsCount = 0;

db.transaction(() => {
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const monthStr = sheetName.trim();
    const year = new Date().getFullYear();

    for (const row of data) {
      if (!row.PRODUCTOR || String(row.PRODUCTOR).toUpperCase().includes("TOTAL")) continue;

      const producerName = String(row.PRODUCTOR).trim().toUpperCase();
      let producer = getProducer.get(producerName, producerName.toLowerCase());
      
      if (!producer) {
         // Some producers might have slight name variations in DB vs Excel, skip if not found
         continue;
      }
      
      const producerId = producer.id;

      for (const [key, value] of Object.entries(row)) {
        const colName = key.trim().toUpperCase();
        if (!EXCLUDED_COLS.includes(colName) && typeof value === "number" && value !== 0) {
          insertCompany.run(colName);
          const companyId = getCompany.get(colName).id;

          insertCollection.run(producerId, companyId, monthStr, year, value);
          collectionsCount++;
        }
      }
    }
  }
})();

console.log(`Restore complete! Inserted ${collectionsCount} collections.`);
}
