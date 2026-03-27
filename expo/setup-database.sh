#!/bin/bash

# Script para configurar la base de datos SQLite

echo "================================"
echo "🗄️  CONFIGURACIÓN DE BASE DE DATOS"
echo "================================"
echo ""

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "❌ No se encontró el archivo .env"
    echo "📋 Copiando env.example a .env..."
    cp env.example .env
    echo "✅ Archivo .env creado"
    echo ""
fi

# Generar el cliente de Prisma
echo "📦 Generando cliente de Prisma..."
bunx prisma generate

# Crear/actualizar la base de datos
echo ""
echo "🗄️  Creando base de datos SQLite..."
bunx prisma migrate dev --name init

echo ""
echo "✅ ¡Base de datos configurada correctamente!"
echo ""
echo "🚀 Puedes iniciar el servidor con: bun run start"
echo ""
