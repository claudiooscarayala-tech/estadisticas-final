const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appDir = fs.readdirSync(__dirname).find(f => f.toLowerCase() === 'app');

if (!appDir) {
  console.error("No se encontró la carpeta app/App");
  process.exit(1);
}

try {
  console.log("Instalando dependencias de backend...");
  execSync(`npm install`, { cwd: path.join(__dirname, appDir, 'backend'), stdio: 'inherit' });
  
  console.log("Instalando dependencias de frontend...");
  execSync(`npm install`, { cwd: path.join(__dirname, appDir, 'frontend'), stdio: 'inherit' });
  
  console.log("Compilando frontend...");
  execSync(`npm run build`, { cwd: path.join(__dirname, appDir, 'frontend'), stdio: 'inherit' });
  
  console.log("Instalando dependencias de mobile-frontend...");
  execSync(`npm install`, { cwd: path.join(__dirname, appDir, 'mobile-frontend'), stdio: 'inherit' });
  
  console.log("Compilando mobile-frontend...");
  execSync(`npm run build`, { cwd: path.join(__dirname, appDir, 'mobile-frontend'), stdio: 'inherit' });
  
  console.log("Construcción completada exitosamente!");
} catch (error) {
  console.error("Error durante la construcción:", error.message);
  process.exit(1);
}
