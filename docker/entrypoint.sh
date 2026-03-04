#!/bin/sh
set -e

echo "⏳ Aplicando migraciones..."
./node_modules/.bin/prisma db push --accept-data-loss

echo "🌱 Inicializando datos..."
node prisma/seed.js

echo "🚀 Iniciando DCK en http://localhost:3000"
exec node server.js
