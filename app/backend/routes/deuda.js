const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const xlsx = require("xlsx");
const nodemailer = require("nodemailer");
const fs = require("fs");

const upload = multer({ dest: 'uploads/' });

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const company = req.body.company || "Digna Seguros";

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const groupedData = {};
    for (const row of data) {
      const producerKey = Object.keys(row).find(k => k.toUpperCase().includes('PRODUCTOR'));
      if (!producerKey) continue;
      
      const producerName = String(row[producerKey]).trim().toUpperCase();
      if (!producerName) continue;

      if (!groupedData[producerName]) {
        groupedData[producerName] = [];
      }
      groupedData[producerName].push(row);
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'claudiooscarayala@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD 
      }
    });

    let emailsSent = 0;

    for (const [producerName, rows] of Object.entries(groupedData)) {
      const producerRow = db.prepare("SELECT email FROM producers WHERE name = ?").get(producerName);
      let email = producerRow?.email;

      if (!email) {
        const firstRow = rows[0];
        const emailKey = Object.keys(firstRow).find(k => k.toUpperCase().includes('MAIL') || k.toUpperCase().includes('EMAIL'));
        if (emailKey) {
          email = firstRow[emailKey];
        }
      }

      if (!email) continue; 

      const newWs = xlsx.utils.json_to_sheet(rows);
      const newWb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(newWb, newWs, `Deuda ${company}`);
      
      const buffer = xlsx.write(newWb, { type: "buffer", bookType: "xlsx" });

      const mailOptions = {
        from: 'claudiooscarayala@gmail.com',
        to: email,
        cc: 'garzonauxiliaradm@gmail.com',
        subject: `Deudores por premio ${company}`,
        text: `Estimado ${producerName}:\n\nEn archivo adjunto enviamos listado de cuotas pendientes de cobro de tu cartera en ${company}, solicitamos analizar y realizar la gestión de cobranzas correspondiente. Agradecemos tu gestión.`,
        attachments: [
          {
            filename: `Deuda_${producerName.replace(/[^a-zA-Z0-9_]/g, '_')}.xlsx`,
            content: buffer
          }
        ]
      };

      try {
         await transporter.sendMail(mailOptions);
         emailsSent++;
      } catch (err) {
         console.error("Error sending to", email, err);
      }
    }
    
    fs.unlinkSync(req.file.path);
    res.json({ success: true, emailsSent });
  } catch (err) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
