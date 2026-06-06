const axios = require("axios");
const cron = require("node-cron");
const db = require("../db");

const WHAPI_URL = "https://gate.whapi.cloud";
const TOKEN = "Aff01P4HOcBvXFG6VVvTAMxGTxSMrB1n"; // Ignoring process.env to prevent conflicts

// Helper to format phone number (Argentinian format handling)
function formatPhoneForWhatsapp(phone) {
  if (!phone) return null;
  // Remove spaces, hyphens, parentheses
  let clean = phone.replace(/[\s\-\(\)]/g, "");
  // If it starts with 0, remove it (area code)
  if (clean.startsWith("0")) clean = clean.substring(1);
  // If it starts with 15, remove it (mobile prefix)
  if (clean.startsWith("15")) clean = clean.substring(2);
  // Prepend 549 if not present
  if (!clean.startsWith("54")) clean = "549" + clean;
  // Ensure it's digits only
  return clean.replace(/\D/g, "");
}

// Function to send a message via Whapi
async function sendWhatsappMessage(phone, text) {
  const formattedPhone = formatPhoneForWhatsapp(phone);
  if (!formattedPhone) throw new Error("Número de teléfono inválido");

  const chatId = `${formattedPhone}@s.whatsapp.net`;
  
  try {
    const response = await axios.post(
      `${WHAPI_URL}/messages/text`,
      {
        typing_time: 0,
        to: chatId,
        body: text
      },
      {
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Whapi API Error:", error.response?.data || error.message);
    throw error;
  }
}

function getLocalToday() {
  const options = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('es-AR', options);
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

// Function to process birthdays for a given date string (YYYY-MM-DD)
async function processBirthdays(dateString = getLocalToday()) {
  const [, month, day] = dateString.split("-");
  
  // Find producers with matching month-day
  const producers = db.prepare(`
    SELECT id, name, phone, birthdate 
    FROM producers 
    WHERE birthdate LIKE ?
  `).all(`%-${month}-${day}`);

  const results = [];

  for (const producer of producers) {
    if (!producer.phone) continue;

    // Check if already sent today
    const existingLog = db.prepare(`
      SELECT id, status FROM birthday_logs WHERE producer_id = ? AND date = ?
    `).get(producer.id, dateString);

    if (existingLog && existingLog.status === 'sent') {
      results.push({ producer, status: "already_sent" });
      continue;
    }

    if (existingLog && existingLog.status === 'failed') {
      db.prepare("DELETE FROM birthday_logs WHERE id = ?").run(existingLog.id);
    }

    try {
      let firstName = producer.name;
      if (producer.name.includes(",")) {
        const afterComma = producer.name.split(",")[1].trim(); // e.g., "CLAUDIO OSCAR - 618"
        firstName = afterComma.split(" ")[0]; // e.g., "CLAUDIO"
        // Title Case
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      } else {
        // If no comma, just take the first word in Title Case
        firstName = firstName.split(" ")[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      }

      const message = `¡Hola ${firstName}! 🎉🎂\n\nDe parte de todo el equipo, queremos mandarte un abrazo gigante en tu día. ¡Deseamos que tengas un muy FELIZ CUMPLEAÑOS lleno de alegrías, buenos momentos y mucha celebración! 🥳✨🥂\n\nQue este nuevo año de vida te traiga muchísimo éxito y cosas lindas. ¡Disfrutá mucho!\n\nCon mucho cariño,\n- El equipo de COA Asesores de Seguros 💙`;
      
      await sendWhatsappMessage(producer.phone, message);
      
      db.prepare(`
        INSERT INTO birthday_logs (producer_id, date, status, message) 
        VALUES (?, ?, 'sent', ?)
      `).run(producer.id, dateString, "Enviado con éxito");
      
      results.push({ producer, status: "sent" });
    } catch (error) {
      const detailedError = error.response?.data?.error?.message || error.response?.data?.message || error.response?.data || error.message;
      const errorMsg = typeof detailedError === 'object' ? JSON.stringify(detailedError) : String(detailedError);
      
      db.prepare(`
        INSERT INTO birthday_logs (producer_id, date, status, message) 
        VALUES (?, ?, 'failed', ?)
      `).run(producer.id, dateString, errorMsg);
      
      results.push({ producer, status: "failed", error: errorMsg });
    }
  }

  return results;
}

// Schedule cron job to run every day at 09:00 AM
function initCron() {
  cron.schedule("0 9 * * *", async () => {
    console.log("Ejecutando tarea de cumpleaños automática (09:00 AM)...");
    await processBirthdays();
  }, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
  });
}

module.exports = {
  sendWhatsappMessage,
  processBirthdays,
  initCron
};
