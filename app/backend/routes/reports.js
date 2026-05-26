const express = require("express");
const router = express.Router();
const db = require("../db");

// Get general reports data
router.get("/", (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    const total = db.prepare("SELECT SUM(amount) as total FROM collections WHERE year = ?").get(year).total || 0;

    const rawByMonth = db.prepare(`
      SELECT col.month, c.name as company, SUM(col.amount) as total 
      FROM collections col
      JOIN companies c ON col.company_id = c.id
      WHERE col.year = ? 
      GROUP BY col.month, c.id
    `).all(year);
    
    const monthMap = {};
    for (const row of rawByMonth) {
      if (!monthMap[row.month]) {
        monthMap[row.month] = { month: row.month, total: 0 };
      }
      monthMap[row.month][row.company] = row.total;
      monthMap[row.month].total += row.total;
    }
    const byMonth = Object.values(monthMap);

    const byCompany = db.prepare(`
      SELECT c.name, SUM(amount) as total 
      FROM collections col
      JOIN companies c ON col.company_id = c.id
      WHERE year = ?
      GROUP BY c.id
      ORDER BY total DESC
    `).all(year);

    const byProducer = db.prepare(`
      SELECT p.id, p.name, SUM(amount) as total 
      FROM collections col
      JOIN producers p ON col.producer_id = p.id
      WHERE year = ?
      GROUP BY p.id
      ORDER BY total DESC
      LIMIT 20
    `).all(year);

    res.json({ total, byMonth, byCompany, byProducer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get province statistics
router.get("/provinces", (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const data = db.prepare(`
      SELECT 
        COALESCE(NULLIF(p.province, ''), 'Sin Provincia') as province,
        COUNT(DISTINCT p.id) as producerCount,
        SUM(c.amount) as totalCollection
      FROM producers p
      LEFT JOIN collections c ON p.id = c.producer_id AND c.year = ?
      GROUP BY COALESCE(NULLIF(p.province, ''), 'Sin Provincia')
      ORDER BY totalCollection DESC
    `).all(year);

    // Handle null sums if a province has no collections
    const cleanedData = data.map(row => ({
      ...row,
      totalCollection: row.totalCollection || 0
    }));

    res.json(cleanedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports by company
router.get("/company/:id", (req, res) => {
  try {
    const companyId = req.params.id;
    const year = req.query.year || new Date().getFullYear();
    
    const currentMonthIndex = new Date().getMonth();
    const maxMonth = currentMonthIndex === 0 ? 1 : currentMonthIndex;
    const validMonths = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ].slice(0, maxMonth);

    const placeholders = validMonths.map(() => "?").join(",");

    const total = db.prepare(`
      SELECT SUM(amount) as total FROM collections 
      WHERE company_id = ? AND year = ? AND month IN (${placeholders})
    `).get(companyId, year, ...validMonths).total || 0;

    const byProducer = db.prepare(`
      SELECT p.id, p.name, SUM(amount) as total 
      FROM collections col
      JOIN producers p ON col.producer_id = p.id
      WHERE col.company_id = ? AND col.year = ? AND col.month IN (${placeholders})
      GROUP BY p.id
      ORDER BY total DESC
    `).all(companyId, year, ...validMonths);

    const byMonth = db.prepare(`
      SELECT month, SUM(amount) as total 
      FROM collections 
      WHERE company_id = ? AND year = ? AND month IN (${placeholders})
      GROUP BY month
    `).all(companyId, year, ...validMonths);

    res.json({ total, byProducer, byMonth, period: validMonths });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports for a specific producer
router.get("/producer/:id", (req, res) => {
  try {
    const producerId = req.params.id;
    const year = req.query.year || new Date().getFullYear();
    const companyId = req.query.companyId;

    const producer = db.prepare("SELECT name FROM producers WHERE id = ?").get(producerId);
    if (!producer) return res.status(404).json({ error: "Producer not found" });

    let total, byMonth, byCompany;
    let companyName = null;

    if (companyId) {
      const comp = db.prepare("SELECT name FROM companies WHERE id = ?").get(companyId);
      if (comp) companyName = comp.name;

      total = db.prepare("SELECT SUM(amount) as total FROM collections WHERE producer_id = ? AND year = ? AND company_id = ?").get(producerId, year, companyId).total || 0;
      byMonth = db.prepare(`
        SELECT month, SUM(amount) as total 
        FROM collections 
        WHERE producer_id = ? AND year = ? AND company_id = ?
        GROUP BY month
      `).all(producerId, year, companyId);
      byCompany = []; 
    } else {
      total = db.prepare("SELECT SUM(amount) as total FROM collections WHERE producer_id = ? AND year = ?").get(producerId, year).total || 0;
      const rawByMonth = db.prepare(`
        SELECT col.month, c.name as company, SUM(col.amount) as total 
        FROM collections col
        JOIN companies c ON col.company_id = c.id
        WHERE col.producer_id = ? AND col.year = ? 
        GROUP BY col.month, c.id
      `).all(producerId, year);
      
      const monthMap = {};
      for (const row of rawByMonth) {
        if (!monthMap[row.month]) {
          monthMap[row.month] = { month: row.month, total: 0 };
        }
        monthMap[row.month][row.company] = row.total;
        monthMap[row.month].total += row.total;
      }
      byMonth = Object.values(monthMap);
      byCompany = db.prepare(`
        SELECT c.id, c.name, SUM(col.amount) as total 
        FROM collections col
        JOIN companies c ON col.company_id = c.id
        WHERE col.producer_id = ? AND col.year = ? 
        GROUP BY c.id
        ORDER BY total DESC
      `).all(producerId, year);
    }

    res.json({ producer: producer.name, company: companyName, total, byMonth, byCompany });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
