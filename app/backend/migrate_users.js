const db = require("./db");
const bcrypt = require("bcryptjs");

function migrate() {
  console.log("Iniciando migración para crear tabla de usuarios...");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin'
    );
  `);

  const checkUser = db.prepare("SELECT id FROM users WHERE username = ?");
  const existingUser = checkUser.get("admin");

  if (!existingUser) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync("admin123", salt);
    
    const insertUser = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
    insertUser.run("admin", hashedPassword, "admin");
    console.log("Usuario 'admin' creado exitosamente con contraseña 'admin123'.");
  } else {
    console.log("El usuario 'admin' ya existe en la base de datos.");
  }

  console.log("Migración completada.");
}

migrate();
