#!/bin/bash
set -e

# Encontrar la carpeta app/App sin importar mayúsculas
APP_DIR=$(find . -maxdepth 1 -iname "app" -type d | head -n 1)

if [ -z "$APP_DIR" ]; then
  echo "Error: No se encontró la carpeta app"
  exit 1
fi

echo "Iniciando construcción en $APP_DIR"

cd "$APP_DIR/backend"
npm install

cd ../frontend
npm install
npm run build

cd ../mobile-frontend
npm install
npm run build

echo "Construcción exitosa"
