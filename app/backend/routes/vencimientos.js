const express = require("express");
require('dns').setDefaultResultOrder('ipv4first');
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const xlsx = require("xlsx-js-style");
const nodemailer = require("nodemailer");
const fs = require("fs");

const jobs = {};

const upload = multer({ dest: 'uploads/' });

router.get("/test-connection", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'claudiooscarayala@gmail.com',
        pass: 'reuxohirsyesrato' 
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000
    });
    
    await transporter.verify();
    res.json({ 
      success: true, 
      message: "Conexión a Gmail exitosa!", 
      passLength: process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.length : 0 
    });
  } catch (err) {
    res.json({ 
      success: false, 
      error: err.message,
      passExists: !!process.env.GMAIL_APP_PASSWORD
    });
  }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const company = req.body.company || "Digna Seguros";

  function formatExcelDate(serial) {
    if (typeof serial !== 'number') return serial;
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = String(date.getUTCFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    
    // Buscar la hoja "Polizas" o usar la primera por defecto
    let sheetName = workbook.SheetNames[0];
    const polizasSheetName = workbook.SheetNames.find(s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('polizas'));
    if (polizasSheetName) {
       sheetName = polizasSheetName;
    }
    
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });

    let headerRowIdx = -1;
    let producerColIdx = -1;
    let emailColIdx = -1;

    console.log(`Buscando cabeceras en ${data.length} filas...`);
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (let j = 0; j < row.length; j++) {
        const cellVal = String(row[j]).trim().toUpperCase();
        if (cellVal.includes('PRODUCTOR')) {
          console.log(`Encontrado PRODUCTOR en fila ${i}, col ${j} con valor: ${cellVal}`);
          headerRowIdx = i;
          producerColIdx = j;
        }
        if (cellVal.includes('MAIL') || cellVal.includes('EMAIL')) {
           emailColIdx = j;
        }
      }
      if (headerRowIdx !== -1) break;
    }

    // Forzar columna H si es Digna y no lo encontró bien
    if (company === "Digna Seguros") {
       producerColIdx = 7; // Columna H
       console.log(`Forzando producerColIdx a 7 (Col H) para Digna Seguros.`);
       // Si no encontró cabecera, asumimos la primera fila no vacía en la col H
       if (headerRowIdx === -1) {
          for(let i=0; i<data.length; i++) {
             if(data[i][7]) { headerRowIdx = i; break; }
          }
       }
    }

    if (headerRowIdx === -1) {
       throw new Error("No se encontró la columna de productor en el archivo.");
    }

    console.log(`headerRowIdx: ${headerRowIdx}, producerColIdx: ${producerColIdx}`);

    // Solo mantenemos la fila de cabeceras para evitar problemas de formato al filtrar columnas
    const preamble = [ data[headerRowIdx] ];
    const dataRows = data.slice(headerRowIdx + 1);

    const groupedData = {};
    for (const row of dataRows) {
      console.log(`Evaluando fila de datos:`, row);
      if (row[producerColIdx] === undefined || row[producerColIdx] === "") {
          console.log(`Saltando fila porque la columna ${producerColIdx} está vacía.`);
          continue;
      }
      
      const producerName = String(row[producerColIdx]).trim().toUpperCase();
      if (!producerName) continue;

      if (!groupedData[producerName]) {
        groupedData[producerName] = [];
      }
      groupedData[producerName].push(row);
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'claudiooscarayala@gmail.com',
        pass: 'reuxohirsyesrato' 
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    let emailsSent = 0;
    
    // Cargar todos los productores una sola vez para búsqueda inteligente
    const allProducers = db.prepare("SELECT name, email FROM producers").all();

    const emailTasks = [];
    
    for (const [producerName, rows] of Object.entries(groupedData)) {
      // Extraer solo la parte del nombre, eliminando números, guiones y comas
      const pureName = producerName.replace(/[0-9-]/g, '').replace(/,/g, '').trim();

      // Búsqueda inteligente en memoria
      let email = null;
      for (const p of allProducers) {
        if (!p.email) continue;
        const dbName = p.name.replace(/[0-9-]/g, '').replace(/,/g, '').trim();
        // Si el nombre de la BD está incluido en el del Excel, o viceversa, lo damos por válido
        if (pureName.includes(dbName) || dbName.includes(pureName)) {
           email = p.email;
           break;
        }
      }

      if (!email && emailColIdx !== -1) {
        email = rows[0][emailColIdx];
      }

      if (!email) {
         continue; 
      }

      let finalRows = [...preamble, ...rows];

      if (company === "Digna Seguros") {
        // Filtrar columnas B(1), D(3), E(4), G(6), I(8), T(19)
        const allowedIndices = [1, 3, 4, 6, 8, 19];
        finalRows = finalRows.map((row, rowIndex) => {
           return allowedIndices.map((origIdx, outputIdx) => {
             let val = row[origIdx] !== undefined ? row[origIdx] : "";
             // Formatear la fecha en la columna C del nuevo excel (que corresponde al índice 4 original), excepto si es la cabecera
             if (origIdx === 4 && rowIndex > 0) {
                val = formatExcelDate(val);
             }
             return val;
           });
        });
      }

      const newWs = xlsx.utils.aoa_to_sheet(finalRows);
      
      // Ajustar el ancho de las columnas
      if (company === "Digna Seguros") {
        newWs['!cols'] = [
          { wch: 18 }, // A: Seccion
          { wch: 12 }, // B: PolizaNro
          { wch: 16 }, // C: FechaVencimiento
          { wch: 40 }, // D: Tomador
          { wch: 60 }, // E: Riesgo
          { wch: 12 }  // F: Estado
        ];

        // Centrar columnas A, B y C
        for (const cellAddress in newWs) {
          if (cellAddress[0] === '!') continue;
          if (cellAddress.startsWith('A') || cellAddress.startsWith('B') || cellAddress.startsWith('C')) {
            if (!newWs[cellAddress].s) newWs[cellAddress].s = {};
            newWs[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
          }
        }
      }

      const newWb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(newWb, newWs, `Vencimientos ${company}`);
      
      const buffer = xlsx.write(newWb, { type: "buffer", bookType: "xlsx" });

      const mailOptions = {
        from: 'claudiooscarayala@gmail.com',
        to: email,
        cc: 'ramosauxiliaradm@gmail.com',
        subject: `Vencimientos del mes ${company} - ${producerName}`,
        text: `Estimado ${producerName}:\n\nLe estamos enviando en un archivo adjunto el listado de vencimientos del mes que indica el excel para su control y correspondientes renovaciones de pólizas de la compañía ${company}.\n\nSaludos cordiales.`,
        attachments: [
          {
            filename: `Vencimientos_${producerName.replace(/[^a-zA-Z0-9_]/g, '_')}.xlsx`,
            content: buffer
          }
        ]
      };

      emailTasks.push({ email, producerName, mailOptions });
    }
    
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const jobId = Date.now().toString();
    jobs[jobId] = {
      id: jobId,
      total: emailTasks.length,
      sent: 0,
      status: 'processing'
    };

    res.json({ success: true, jobId, total: emailTasks.length });

    // Enviar correos en segundo plano (Background process)
    (async () => {
      for (const task of emailTasks) {
        try {
          await transporter.sendMail(task.mailOptions);
          jobs[jobId].sent++;
        } catch (err) {
          console.error("Error sending to", task.email, err);
          jobs[jobId].sent++; // Contamos igual para que el progreso avance
        }
      }
      jobs[jobId].status = 'completed';
      
      // Limpiar memoria después de 1 hora
      setTimeout(() => {
         delete jobs[jobId];
      }, 3600000);
    })();

  } catch (err) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
});

router.get("/status/:jobId", (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json(job);
});

module.exports = router;
