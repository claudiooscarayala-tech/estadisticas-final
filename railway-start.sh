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

cd "$APP_DIR/backend"

if [ -f "migrate-db.js" ]; then
  echo "Ejecutando script de migracion de base de datos..."
  node migrate-db.js
fi

node server.js
