#!/bin/bash
set -e

APP_DIR=$(find . -maxdepth 1 -iname "app" -type d | head -n 1)

cd "$APP_DIR/backend"
node server.js
