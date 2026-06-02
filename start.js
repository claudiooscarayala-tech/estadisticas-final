const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appDir = fs.readdirSync(__dirname).find(f => f.toLowerCase() === 'app');

if (!appDir) {
  console.error("No se encontró la carpeta app/App");
  process.exit(1);
}

try {
  console.log("Iniciando backend...");
  execSync(`node server.js`, { cwd: path.join(__dirname, appDir, 'backend'), stdio: 'inherit' });
} catch (error) {
  console.error("Error iniciando servidor:", error.message);
  process.exit(1);
}
