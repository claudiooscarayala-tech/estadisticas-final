const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all producers
router.get("/", (req, res) => {
  try {
    const producers = db.prepare("SELECT id, name, email, phone, matricula, address, city, province, birthdate, dni FROM producers ORDER BY name").all();
    res.json(producers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login producer via DNI
router.post("/login", (req, res) => {
  const { dni } = req.body;
  if (!dni) {
    return res.status(400).json({ error: "El DNI es obligatorio" });
  }

  try {
    const producer = db.prepare("SELECT id, name, dni FROM producers WHERE dni = ?").get(dni);
    if (!producer) {
      return res.status(401).json({ error: "DNI incorrecto o no registrado" });
    }
    
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";
    const token = jwt.sign(
      { id: producer.id, username: producer.name, role: 'producer' },
      JWT_SECRET,
      { expiresIn: "12h" }
    );
    
    res.json({ message: "Login exitoso", producer, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new producer
router.post("/", (req, res) => {
  if (req.user && req.user.role === 'producer') return res.status(403).json({ error: "Acceso denegado" });
  const { name, email, phone, matricula, address, city, province, birthdate, dni } = req.body;
  if (!name) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO producers (name, email, phone, matricula, address, city, province, birthdate, dni) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = insert.run(
      name, email || null, phone || null, matricula || null, 
      address || null, city || null, province || null, birthdate || null, dni || null
    );
    res.status(201).json({ id: info.lastInsertRowid, message: "Productor creado exitosamente" });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "Ya existe un productor con ese nombre" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update an existing producer
router.put("/:id", (req, res) => {
  if (req.user && req.user.role === 'producer') return res.status(403).json({ error: "Acceso denegado" });
  const id = req.params.id;
  const { name, email, phone, matricula, address, city, province, birthdate, dni } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  try {
    const update = db.prepare(`
      UPDATE producers 
      SET name = ?, email = ?, phone = ?, matricula = ?, address = ?, city = ?, province = ?, birthdate = ?, dni = ?
      WHERE id = ?
    `);
    const info = update.run(
      name, email || null, phone || null, matricula || null, 
      address || null, city || null, province || null, birthdate || null, dni || null, id
    );

    if (info.changes === 0) {
      return res.status(404).json({ error: "Productor no encontrado" });
    }
    res.json({ message: "Productor actualizado exitosamente" });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "Ya existe otro productor con ese nombre" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});
// Delete a producer
router.delete("/:id", (req, res) => {
  if (req.user && req.user.role === 'producer') return res.status(403).json({ error: "Acceso denegado" });
  const id = req.params.id;
  try {
    // Check if producer has any collections
    const checkCollections = db.prepare("SELECT COUNT(*) as count FROM collections WHERE producer_id = ?").get(id);
    if (checkCollections.count > 0) {
      return res.status(400).json({ error: "No se puede eliminar el productor porque tiene cobranzas activas (monto > 0)." });
    }

    const info = db.prepare("DELETE FROM producers WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: "Productor no encontrado" });
    }
    res.json({ message: "Productor eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
