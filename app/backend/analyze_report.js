const fs = require('fs');
const db = require('./db');

const logPath = "C:/Users/Usuario/.gemini/antigravity/brain/6c34193f-06f3-406e-9f8c-d5bd9c240577/.system_generated/tasks/task-215.log";
const logContent = fs.readFileSync(logPath, 'utf8');

const regex = /'(\d+ - [^']+)'/g;
let match;
const producersFound = new Set();

while ((match = regex.exec(logContent)) !== null) {
  producersFound.add(match[1]);
}

const report = {
  sent: [],
  not_sent: []
};

for (const producerName of producersFound) {
  const pureName = producerName.replace(/[0-9-]/g, '').trim();
  const producerRow = db.prepare("SELECT email FROM producers WHERE name LIKE ?").get(`%${pureName}%`);
  
  if (producerRow && producerRow.email) {
    report.sent.push({
      producer: producerName,
      email: producerRow.email
    });
  } else {
    report.not_sent.push({
      producer: producerName,
      reason: "No se encontró un correo electrónico en la base de datos para este nombre."
    });
  }
}

// Write the report to an artifact
let reportMd = `# Reporte de Envío de Vencimientos\n\n`;
reportMd += `Total de productores distintos encontrados en el archivo: ${producersFound.size}\n`;
reportMd += `Correos que se pudieron enviar (con email encontrado): ${report.sent.length}\n`;
reportMd += `Correos NO enviados (sin email): ${report.not_sent.length}\n\n`;

reportMd += `## ❌ Productores sin correo (No se envió)\n\n`;
reportMd += `| Productor en Excel | Motivo |\n`;
reportMd += `| --- | --- |\n`;
report.not_sent.forEach(p => {
  reportMd += `| ${p.producer} | ${p.reason} |\n`;
});

reportMd += `\n## ✅ Productores enviados\n\n`;
reportMd += `| Productor en Excel | Correo Destino |\n`;
reportMd += `| --- | --- |\n`;
report.sent.forEach(p => {
  reportMd += `| ${p.producer} | ${p.email} |\n`;
});

fs.writeFileSync('C:/Users/Usuario/.gemini/antigravity/brain/6c34193f-06f3-406e-9f8c-d5bd9c240577/reporte_envios.md', reportMd);
console.log("Report generated: reporte_envios.md");
console.log(`Total found: ${producersFound.size}, Sent: ${report.sent.length}, Not Sent: ${report.not_sent.length}`);
