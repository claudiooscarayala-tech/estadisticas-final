const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const dbPath = process.env.DB_PATH || "database.sqlite";

if (process.env.DB_PATH && !fs.existsSync(dbPath)) {
  if (fs.existsSync(path.join(__dirname, "database.sqlite"))) {
    fs.copyFileSync(path.join(__dirname, "database.sqlite"), dbPath);
    console.log("Base de datos copiada al volumen persistente.");
  }
}

const db = new Database(dbPath);

// Asegurar que las nuevas compañías existan en la base de datos de producción
db.exec(`
  INSERT INTO companies (name) 
  SELECT 'SAN CRISTOBAL' WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name='SAN CRISTOBAL');
  
  INSERT INTO companies (name) 
  SELECT 'MERCANTIL ANDINA' WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name='MERCANTIL ANDINA');
`);

module.exports = db;
