const express = require("express");
const router = express.Router();
const db = require("../db");

// Save collections for a specific month and company
router.post("/", (req, res) => {
  const { month, year, company_id, collections } = req.body;
  
  if (!month || !year || !company_id || !collections) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const insertStmt = db.prepare(
    "INSERT INTO collections (producer_id, company_id, month, year, amount) VALUES (?, ?, ?, ?, ?)"
  );
  const checkStmt = db.prepare(
    "SELECT id FROM collections WHERE producer_id = ? AND company_id = ? AND month = ? AND year = ?"
  );
  const updateStmt = db.prepare(
    "UPDATE collections SET amount = ? WHERE id = ?"
  );

  try {
    db.transaction(() => {
      for (const col of collections) {
        const existing = checkStmt.get(col.producer_id, company_id, month, year);
        if (existing) {
          if (col.amount === 0) {
             db.prepare("DELETE FROM collections WHERE id = ?").run(existing.id);
          } else {
             updateStmt.run(col.amount, existing.id);
          }
        } else {
          if (col.amount > 0) {
            insertStmt.run(col.producer_id, company_id, month, year, col.amount);
          }
        }
      }
    })();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collections for data entry
router.get("/", (req, res) => {
  const { month, year, company_id } = req.query;
  try {
    const data = db.prepare(
      "SELECT producer_id, amount FROM collections WHERE month = ? AND year = ? AND company_id = ?"
    ).all(month, year, company_id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
