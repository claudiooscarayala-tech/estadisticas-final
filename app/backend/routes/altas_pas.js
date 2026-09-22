const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directory exists
const uploadsDir = path.join(__dirname, '../uploads/altas');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para guardar archivos en uploads/altas
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/altas/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// POST /api/public/altas-pas - Guardar un nuevo PAS (ruta pública)
router.post("/public/altas-pas", upload.fields([
  { name: 'constancia_afip', maxCount: 1 },
  { name: 'constancia_iibb', maxCount: 1 },
  { name: 'pago_matricula', maxCount: 1 },
  { name: 'dni_frente', maxCount: 1 },
  { name: 'dni_dorso', maxCount: 1 },
  { name: 'cipas_frente', maxCount: 1 },
  { name: 'cipas_dorso', maxCount: 1 },
  { name: 'pago_libros', maxCount: 1 },
  { name: 'constancia_uif', maxCount: 1 },
  { name: 'constancia_cbu', maxCount: 1 }
]), (req, res) => {
  try {
    const { 
      compania_alta, apellido, nombre, dni, cuit, condicion_fiscal, matricula, companias, cbu, banco_cobro, recomendado_por
    } = req.body;

    const getFilePath = (fieldname) => req.files && req.files[fieldname] ? req.files[fieldname][0].path.replace(/\\/g, '/') : null;

    const constancia_afip = getFilePath('constancia_afip');
    const constancia_iibb = getFilePath('constancia_iibb');
    const pago_matricula = getFilePath('pago_matricula');
    const dni_frente = getFilePath('dni_frente');
    const dni_dorso = getFilePath('dni_dorso');
    const cipas_frente = getFilePath('cipas_frente');
    const cipas_dorso = getFilePath('cipas_dorso');
    const pago_libros = getFilePath('pago_libros');
    const constancia_uif = getFilePath('constancia_uif');
    const constancia_cbu = getFilePath('constancia_cbu');

    if (!compania_alta || !apellido || !nombre || !dni || !cuit) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const stmt = db.prepare(`
      INSERT INTO altas_pas (
        compania_alta, apellido, nombre, dni, cuit, condicion_fiscal, matricula, companias, cbu, banco_cobro,
        constancia_afip, constancia_iibb, pago_matricula, dni_frente, dni_dorso, cipas_frente, cipas_dorso, pago_libros, constancia_uif, constancia_cbu, recomendado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      compania_alta, apellido, nombre, dni, cuit, condicion_fiscal, matricula, companias, cbu, banco_cobro,
      constancia_afip, constancia_iibb, pago_matricula, dni_frente, dni_dorso, cipas_frente, cipas_dorso, pago_libros, constancia_uif, constancia_cbu, recomendado_por
    );

    res.status(201).json({ id: result.lastInsertRowid, message: "Inscripción guardada correctamente" });
  } catch (error) {
    console.error("Error al guardar alta de PAS:", error);
    res.status(500).json({ error: "Error al guardar el formulario" });
  }
});

// GET /api/altas-pas - Listar todos (ruta protegida)
const authMiddleware = require("../middleware/auth");
router.get("/altas-pas", authMiddleware, (req, res) => {
  try {
    const altas = db.prepare("SELECT * FROM altas_pas ORDER BY id DESC").all();
    res.json(altas);
  } catch (error) {
    console.error("Error al obtener altas de PAS:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;
