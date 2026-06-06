const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }

  try {
    // 1. Intentar como administrador (users table)
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    
    if (user) {
      const isMatch = bcrypt.compareSync(password, user.password);
      if (isMatch) {
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: "12h" }
        );
        return res.json({
          message: "Login exitoso",
          token,
          user: { id: user.id, username: user.username, role: user.role }
        });
      }
    }

    // 2. Intentar como productor (producers table)
    const producer = db.prepare("SELECT * FROM producers WHERE matricula = ?").get(username.trim());
    
    if (producer && producer.dni && producer.dni.trim() === password.trim()) {
      const token = jwt.sign(
        { id: producer.id, username: producer.name, role: 'producer' },
        JWT_SECRET,
        { expiresIn: "12h" }
      );
      return res.json({
        message: "Login exitoso",
        token,
        user: { id: producer.id, username: producer.name, role: 'producer' }
      });
    }

    // Si no coincide ni admin ni productor
    return res.status(401).json({ error: "Credenciales inválidas" });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
