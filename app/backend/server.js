const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const authMiddleware = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const producersRoutes = require("./routes/producers");
const companiesRoutes = require("./routes/companies");
const collectionsRoutes = require("./routes/collections");
const reportsRoutes = require("./routes/reports");
const deudaRoutes = require("./routes/deuda");
const pointsRoutes = require("./routes/points");
const storeRoutes = require("./routes/store");
const birthdaysRoutes = require("./routes/birthdays");
const { initCron } = require("./services/whatsapp");

// --- Public Endpoints ---
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

// Initialize Cron Jobs
initCron();

const PORT = process.env.PORT || 3001;
const dataPath = process.env.DATA_PATH || __dirname;
const uploadsPath = path.join(dataPath, "uploads");

// Serve uploaded images statically
app.use("/uploads", express.static(uploadsPath));

// Serve PC frontend under /admin
app.use("/admin", express.static(path.join(__dirname, "../frontend/dist")));

// Serve Mobile frontend under /
app.use(express.static(path.join(__dirname, "../mobile-frontend/dist")));

// Handle React Router logic for PC frontend
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// Handle React Router logic for Mobile frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../mobile-frontend/dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
