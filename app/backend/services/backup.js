const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

function initBackupCron() {
  // Ejecutar todos los días a las 22:00
  cron.schedule("0 22 * * *", () => {
    console.log("[CRON] Iniciando proceso de copia de seguridad automática...");
    
    try {
      const dataPath = process.env.DATA_PATH || path.join(__dirname, "..");
      const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "database.sqlite");
      const backupsDir = path.join(dataPath, "backups");

      if (!fs.existsSync(dbPath)) {
        console.error("[CRON] No se encontró database.sqlite para respaldar.");
        return;
      }

      // Crear directorio de backups si no existe
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      // Obtener fecha en UTC-3
      const now = new Date();
      now.setUTCHours(now.getUTCHours() - 3);
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const hour = String(now.getUTCHours()).padStart(2, '0');
      const minute = String(now.getUTCMinutes()).padStart(2, '0');
      
      const backupFileName = `database_backup_${year}-${month}-${day}_${hour}${minute}.sqlite`;
      const backupFilePath = path.join(backupsDir, backupFileName);

      // Copiar la base de datos
      fs.copyFileSync(dbPath, backupFilePath);
      console.log(`[CRON] Copia de seguridad creada exitosamente: ${backupFileName}`);

      // Mantener solo los últimos 3 días (o los últimos 3 archivos si es diario)
      const files = fs.readdirSync(backupsDir);
      const backupFiles = files
        .filter(f => f.startsWith("database_backup_") && f.endsWith(".sqlite"))
        .map(f => {
          const stats = fs.statSync(path.join(backupsDir, f));
          return { name: f, time: stats.mtime.getTime() };
        })
        .sort((a, b) => b.time - a.time); // Ordenar de más reciente a más antiguo

      if (backupFiles.length > 3) {
        const filesToDelete = backupFiles.slice(3);
        for (const fileObj of filesToDelete) {
          const fileToDeletePath = path.join(backupsDir, fileObj.name);
          fs.unlinkSync(fileToDeletePath);
          console.log(`[CRON] Copia de seguridad antigua eliminada: ${fileObj.name}`);
        }
      }
    } catch (error) {
      console.error("[CRON] Error al realizar la copia de seguridad:", error);
    }
  });

  console.log("Servicio de backups automáticos (22:00) inicializado.");
}

module.exports = { initBackupCron };
