const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/siniestros - Listar siniestros
router.get("/", (req, res) => {
  try {
    const siniestros = db.prepare(`
      SELECT s.*, p.name as producer_name 
      FROM siniestros s
      LEFT JOIN producers p ON s.producer_id = p.id
      ORDER BY 
        CASE WHEN s.somos_culpables = 'Sí' THEN 1 ELSE 2 END,
        s.fecha ASC
    `).all();
    res.json(siniestros);
  } catch (error) {
    console.error("Error al obtener siniestros:", error);
    res.status(500).json({ error: "Error al obtener siniestros" });
  }
});

// POST /api/siniestros - Crear un siniestro
router.post("/", (req, res) => {
  const { 
    fecha, fecha_siniestro, compania, stros, poliza, asegurado, patente, detalle_stro, producer_id,
    somos_culpables, terceros, tel_tercero, fecha_contacto, detalle_comunicacion
  } = req.body;
  
  if (!compania || !producer_id || !asegurado) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    // Generar el número automáticamente
    const row = db.prepare("SELECT COUNT(*) as count FROM siniestros").get();
    const nextNumber = row.count + 1;
    // Formatear a 4 dígitos (ej. 0001)
    const numeroFormateado = String(nextNumber).padStart(4, '0');

    const stmt = db.prepare(`
      INSERT INTO siniestros (
        numero, fecha, fecha_siniestro, compania, stros, poliza, asegurado, patente, detalle_stro, producer_id,
        somos_culpables, terceros, tel_tercero, fecha_contacto, detalle_comunicacion
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      numeroFormateado, fecha, fecha_siniestro, compania, stros, poliza, asegurado, patente, detalle_stro, producer_id,
      somos_culpables, terceros, tel_tercero, fecha_contacto, detalle_comunicacion
    );
    
    const newSiniestro = db.prepare(`
      SELECT s.*, p.name as producer_name 
      FROM siniestros s
      LEFT JOIN producers p ON s.producer_id = p.id
      WHERE s.id = ?
    `).get(info.lastInsertRowid);
    
    res.status(201).json(newSiniestro);
  } catch (error) {
    console.error("Error al guardar siniestro:", error);
    res.status(500).json({ error: "Error al guardar siniestro" });
  }
});

// PUT /api/siniestros/:id - Actualizar un siniestro
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { 
    fecha, fecha_siniestro, compania, stros, poliza, asegurado, patente, detalle_stro, producer_id,
    somos_culpables, terceros, tel_tercero, fecha_contacto, detalle_comunicacion
  } = req.body;

  if (!compania || !producer_id || !asegurado) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const stmt = db.prepare(`
      UPDATE siniestros SET 
        fecha = ?, fecha_siniestro = ?, compania = ?, stros = ?, poliza = ?, asegurado = ?, patente = ?, 
        detalle_stro = ?, producer_id = ?, somos_culpables = ?, terceros = ?, 
        tel_tercero = ?, fecha_contacto = ?, detalle_comunicacion = ?
      WHERE id = ?
    `);

    stmt.run(
      fecha, fecha_siniestro, compania, stros, poliza, asegurado, patente, detalle_stro, producer_id,
      somos_culpables, terceros, tel_tercero, fecha_contacto, detalle_comunicacion, id
    );

    const updatedSiniestro = db.prepare(`
      SELECT s.*, p.name as producer_name 
      FROM siniestros s
      LEFT JOIN producers p ON s.producer_id = p.id
      WHERE s.id = ?
    `).get(id);

    if (!updatedSiniestro) {
      return res.status(404).json({ error: "Siniestro no encontrado" });
    }

    res.json(updatedSiniestro);
  } catch (error) {
    console.error("Error al actualizar siniestro:", error);
    res.status(500).json({ error: "Error al actualizar siniestro" });
  }
});

module.exports = router;
