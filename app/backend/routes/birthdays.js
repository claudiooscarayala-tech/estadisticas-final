const express = require("express");
const router = express.Router();
const db = require("../db");
const { processBirthdays } = require("../services/whatsapp");

// GET /api/birthdays/today
// Returns the list of producers having a birthday today and their message status
router.get("/today", (req, res) => {
  try {
    // Get date in Argentina Timezone (UTC-3) manually to avoid ICU data issues on Linux
    const now = new Date();
    now.setUTCHours(now.getUTCHours() - 3);
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const producers = db.prepare(`
      SELECT p.id, p.name, p.phone, p.birthdate, l.status, l.message
      FROM producers p
      LEFT JOIN birthday_logs l ON p.id = l.producer_id AND l.date = ?
      WHERE p.birthdate LIKE ?
    `).all(today, `%-${month}-${day}`);

    res.json(producers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/birthdays/trigger
// Manually triggers the birthday sending process for today
router.post("/trigger", async (req, res) => {
  try {
    const results = await processBirthdays();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
