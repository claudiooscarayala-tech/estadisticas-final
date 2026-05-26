const express = require("express");
const router = express.Router();
const db = require("../db");
const { processBirthdays } = require("../services/whatsapp");

// GET /api/birthdays/today
// Returns the list of producers having a birthday today and their message status
router.get("/today", (req, res) => {
  try {
    // Get date in Argentina Timezone (UTC-3)
    const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('es-AR', options);
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
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
