const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    let query = `
      SELECT 
        p.id as producer_id,
        p.name as producer_name,
        col.month,
        SUM(col.amount) as total_amount
      FROM collections col
      JOIN producers p ON col.producer_id = p.id
      WHERE col.year = ?
    `;
    const params = [year];

    if (req.user && req.user.role === 'producer') {
      query += ` AND p.id = ? `;
      params.push(req.user.id);
    }

    query += ` GROUP BY p.id, col.month `;

    const rows = db.prepare(query).all(...params);

    const producerMap = {};
    let globalTotalPoints = 0;

    for (const row of rows) {
      if (!producerMap[row.producer_id]) {
        producerMap[row.producer_id] = {
          id: row.producer_id,
          name: row.producer_name,
          months: {},
          totalPoints: 0
        };
      }
      const points = Math.floor(row.total_amount * 0.0001);
      producerMap[row.producer_id].months[row.month] = points;
      producerMap[row.producer_id].totalPoints += points;
      globalTotalPoints += points;
    }

    const data = Object.values(producerMap).sort((a, b) => b.totalPoints - a.totalPoints);

    res.json({
      globalTotalPoints,
      topProducer: data.length > 0 ? data[0] : null,
      producers: data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
