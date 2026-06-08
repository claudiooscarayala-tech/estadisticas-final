const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const authMiddleware = require("./middleware/auth");
const rateLimit = require("express-rate-limit");

// Configurar límite de intentos (10 peticiones cada 15 minutos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos." }
});

const authRoutes = require("./routes/auth");
const producersRoutes = require("./routes/producers");
const companiesRoutes = require("./routes/companies");
const collectionsRoutes = require("./routes/collections");
const reportsRoutes = require("./routes/reports");
const deudaRoutes = require("./routes/deuda");
const pointsRoutes = require("./routes/points");
const storeRoutes = require("./routes/store");
const birthdaysRoutes = require("./routes/birthdays");
const vencimientosRoutes = require("./routes/vencimientos");
const { initCron } = require("./services/whatsapp");

// --- Public Endpoints ---
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);

// --- Protected Endpoints ---
app.use("/api/producers", authMiddleware, producersRoutes);
app.use("/api/companies", authMiddleware, companiesRoutes);
app.use("/api/collections", authMiddleware, collectionsRoutes);
app.use("/api/reports", authMiddleware, reportsRoutes);
app.use("/api/deuda", authMiddleware, deudaRoutes);
app.use("/api/points", authMiddleware, pointsRoutes);
app.use("/api/store", authMiddleware, storeRoutes);
app.use("/api/birthdays", authMiddleware, birthdaysRoutes);
app.use("/api/vencimientos", authMiddleware, vencimientosRoutes);

// Initialize Cron Jobs
initCron();
const { initBackupCron } = require("./services/backup");
initBackupCron();

const PORT = process.env.PORT || 3001;
const dataPath = process.env.DATA_PATH || __dirname;
const uploadsPath = path.join(dataPath, "uploads");

// Serve uploaded images statically, fallback to production if not found locally
app.use("/uploads", (req, res, next) => {
  const localFile = path.join(uploadsPath, req.path);
  const fs = require("fs");
  if (fs.existsSync(localFile) && fs.lstatSync(localFile).isFile()) {
    res.sendFile(localFile);
  } else {
    res.redirect(`https://estadisticas-final-production.up.railway.app/uploads${req.path}`);
  }
});

// Serve PC frontend under /admin
app.use("/admin", express.static(path.join(__dirname, "../frontend/dist")));

// Serve Mobile frontend under /
app.use(express.static(path.join(__dirname, "../mobile-frontend/dist")));

// FALLBACK: Serve assets for BOTH frontends in case they request /assets directly
app.use("/assets", express.static(path.join(__dirname, "../frontend/dist/assets")));
app.use("/assets", express.static(path.join(__dirname, "../mobile-frontend/dist/assets")));

// Handle React Router logic for PC frontend
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// Handle React Router logic for Mobile frontend
app.get("*", (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, "../mobile-frontend/dist", "index.html"));
});

// DEBUG ENDPOINT
app.get("/api/debug-uploads", authMiddleware, (req, res) => {
  if (req.user && req.user.role === 'producer') return res.status(403).json({ error: "Acceso denegado" });
  try {
    const fs = require('fs');
    const dataP = process.env.DATA_PATH || 'NOT SET';
    const dbP = process.env.DB_PATH || 'NOT SET';
    const upPath = path.join(process.env.DATA_PATH || __dirname, "uploads");
    
    let files = [];
    if (fs.existsSync(upPath)) {
      files = fs.readdirSync(upPath);
    }
    
    res.json({
      DATA_PATH: dataP,
      DB_PATH: dbP,
      uploadsPath: upPath,
      exists: fs.existsSync(upPath),
      files: files
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DUMP DB ENDPOINT (To easily backup production database to local machine)
app.get("/api/download-db", authMiddleware, (req, res) => {
  if (req.user && req.user.role === 'producer') return res.status(403).json({ error: "Acceso denegado" });
  try {
    const dbPath = process.env.DB_PATH || path.join(__dirname, "database.sqlite");
    if (require("fs").existsSync(dbPath)) {
      res.download(dbPath, "database.sqlite");
    } else {
      res.status(404).send("Database file not found");
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
