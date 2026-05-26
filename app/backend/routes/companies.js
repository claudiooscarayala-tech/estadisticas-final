const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all companies
router.get("/", (req, res) => {
  try {
    const companies = db.prepare("SELECT * FROM companies ORDER BY name").all();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
