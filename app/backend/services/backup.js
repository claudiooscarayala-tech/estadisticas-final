const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

function initBackupCron() {
  // Ejecutar todos los días a las 03:00 AM
  cron.schedule("0 3 * * *", () => {
    console.log("[Backup] Iniciando copia de seguridad programada...");
    try {
      const dataPath = process.env.DATA_PATH || path.join(__dirname, "..");
      const dbPath = process.env.DB_PATH || path.join(dataPath, "database.sqlite");
      const uploadsPath = path.join(dataPath, "uploads");

      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
      }

      if (fs.existsSync(dbPath)) {
        const date = new Date();
        const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const backupFilename = `backup_db_${dateString}.sqlite`;
        const backupPath = path.join(uploadsPath, backupFilename);

        // Hacer la copia
        fs.copyFileSync(dbPath, backupPath);
        console.log(`[Backup] Copia de seguridad guardada en: ${backupPath}`);

        // Eliminar backups antiguos manteniendo solo los 4 más recientes
        const files = fs.readdirSync(uploadsPath);
        const backupFiles = files
          .filter(file => file.startsWith("backup_db_") && file.endsWith(".sqlite"))
          .map(file => ({
            name: file,
            path: path.join(uploadsPath, file),
            time: fs.statSync(path.join(uploadsPath, file)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time); // Ordenar de más nuevo a más viejo

        // Dejar los primeros 4 y eliminar el resto
        const filesToDelete = backupFiles.slice(4);
        for (const fileObj of filesToDelete) {
          fs.unlinkSync(fileObj.path);
          console.log(`[Backup] Archivo antiguo eliminado: ${fileObj.name}`);
        }
      } else {
        console.warn("[Backup] No se encontró el archivo de la base de datos para respaldar.");
      }
    } catch (error) {
      console.error("[Backup] Error durante la copia de seguridad:", error);
    }
  });
}

module.exports = { initBackupCron };
