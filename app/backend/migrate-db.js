const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let backupPath = path.join(__dirname, '..', 'products-backup.json');
if (!fs.existsSync(backupPath)) {
  backupPath = path.join(__dirname, '..', '..', 'products-backup.json');
}

let uploadsBackupPath = path.join(__dirname, '..', 'uploads-backup');
if (!fs.existsSync(uploadsBackupPath)) {
  uploadsBackupPath = path.join(__dirname, '..', '..', 'uploads-backup');
}

const uploadsDestPath = path.join(__dirname, 'uploads');

if (!fs.existsSync(backupPath)) {
  console.log('No backup file found at ' + backupPath + ', skipping migration.');
  process.exit(0);
}

const products = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
const db = new Database(path.join(__dirname, 'database.sqlite'));

db.prepare('PRAGMA foreign_keys = OFF').run();

// Prepare insert statement
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
    console.error('Error inserting product:', p.name, err);
  }
}

db.prepare('PRAGMA foreign_keys = ON').run();
db.close();

console.log(`Migrated ${count} products to the database.`);

// Copy images
if (fs.existsSync(uploadsBackupPath)) {
  if (!fs.existsSync(uploadsDestPath)) {
    fs.mkdirSync(uploadsDestPath, { recursive: true });
  }
  const files = fs.readdirSync(uploadsBackupPath);
  let imgCount = 0;
  for (const file of files) {
    fs.copyFileSync(path.join(uploadsBackupPath, file), path.join(uploadsDestPath, file));
    imgCount++;
  }
  console.log(`Copied ${imgCount} images.`);
}

// Rename backup so it doesn't run again
fs.renameSync(backupPath, backupPath + '.done');
console.log('Migration complete.');
