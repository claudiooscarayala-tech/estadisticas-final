#!/bin/bash
set -e

if [ -d "./app" ]; then
  APP_DIR="./app"
elif [ -d "./App" ]; then
  APP_DIR="./App"
else
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
