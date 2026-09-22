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

db.exec(`
  CREATE TABLE IF NOT EXISTS siniestros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT,
    fecha TEXT,
    compania TEXT,
    stros TEXT,
    poliza TEXT,
    asegurado TEXT,
    patente TEXT,
    detalle_stro TEXT,
    producer_id INTEGER,
    somos_culpables TEXT,
    terceros TEXT,
    tel_tercero TEXT,
    fecha_contacto TEXT,
    detalle_comunicacion TEXT,
    FOREIGN KEY(producer_id) REFERENCES producers(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS altas_pas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compania_alta TEXT,
    apellido TEXT,
    nombre TEXT,
    dni TEXT,
    cuit TEXT,
    condicion_fiscal TEXT,
    matricula TEXT,
    companias TEXT,
    cbu TEXT,
    constancia_afip TEXT,
    cipas TEXT,
    banco_cobro TEXT,
    constancia_iibb TEXT,
    pago_matricula TEXT,
    dni_frente TEXT,
    dni_dorso TEXT,
    cipas_frente TEXT,
    cipas_dorso TEXT,
    pago_libros TEXT,
    constancia_uif TEXT,
    constancia_cbu TEXT,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migraciones automáticas para nuevas columnas
const autoMigrate = [
  "ALTER TABLE store_products ADD COLUMN price_pesos_mixed REAL DEFAULT 0",
  "ALTER TABLE store_products ADD COLUMN price_points_mixed INTEGER DEFAULT 0",
  "ALTER TABLE store_products ADD COLUMN image_url_2 TEXT",
  "ALTER TABLE store_products ADD COLUMN image_url_3 TEXT",
  "ALTER TABLE store_products ADD COLUMN supplier TEXT",
  "ALTER TABLE store_orders ADD COLUMN payment_type TEXT DEFAULT 'full_points'",
  "ALTER TABLE store_orders ADD COLUMN pesos_spent REAL DEFAULT 0",
  "ALTER TABLE store_products ADD COLUMN base_cost REAL DEFAULT 0",
  "ALTER TABLE store_products ADD COLUMN tarifa INTEGER DEFAULT 1",
  "ALTER TABLE siniestros ADD COLUMN somos_culpables TEXT",
  "ALTER TABLE siniestros ADD COLUMN terceros TEXT",
  "ALTER TABLE siniestros ADD COLUMN tel_tercero TEXT",
  "ALTER TABLE siniestros ADD COLUMN fecha_contacto TEXT",
  "ALTER TABLE siniestros ADD COLUMN detalle_comunicacion TEXT",
  "ALTER TABLE siniestros ADD COLUMN fecha_siniestro TEXT",
  "ALTER TABLE altas_pas ADD COLUMN compania_alta TEXT",
  "ALTER TABLE altas_pas ADD COLUMN banco_cobro TEXT",
  "ALTER TABLE altas_pas ADD COLUMN constancia_iibb TEXT",
  "ALTER TABLE altas_pas ADD COLUMN pago_matricula TEXT",
  "ALTER TABLE altas_pas ADD COLUMN dni_frente TEXT",
  "ALTER TABLE altas_pas ADD COLUMN dni_dorso TEXT",
  "ALTER TABLE altas_pas ADD COLUMN cipas_frente TEXT",
  "ALTER TABLE altas_pas ADD COLUMN cipas_dorso TEXT",
  "ALTER TABLE altas_pas ADD COLUMN pago_libros TEXT",
  "ALTER TABLE altas_pas ADD COLUMN constancia_uif TEXT",
  "ALTER TABLE altas_pas ADD COLUMN constancia_cbu TEXT"
];

for (const query of autoMigrate) {
  try {
    db.exec(query);
  } catch (err) {
    // La columna ya existe, ignorar el error
  }
}

try {
  db.exec("UPDATE store_products SET tarifa = 1, base_cost = ROUND(price_pesos / 2.2, 2) WHERE base_cost = 0 OR base_cost IS NULL");
} catch (err) {
  // Ignorar error de actualización
}

module.exports = db;
