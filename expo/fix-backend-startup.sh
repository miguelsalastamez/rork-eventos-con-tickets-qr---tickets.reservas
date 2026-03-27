#!/bin/bash

echo "🛠️  Arreglando el Backend..."
echo ""

# Paso 1: Generar el Cliente de Prisma
echo "📦 Paso 1/3: Generando Cliente de Prisma..."
bunx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Cliente de Prisma generado correctamente"
else
    echo "❌ Error al generar el Cliente de Prisma"
    exit 1
fi

echo ""

# Paso 2: Crear/Actualizar la Base de Datos
echo "🗄️  Paso 2/3: Creando Base de Datos..."
bunx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo "✅ Base de datos creada correctamente"
else
    echo "❌ Error al crear la base de datos"
    exit 1
fi

echo ""

# Paso 3: Verificar la Base de Datos
echo "🔍 Paso 3/3: Verificando conexión a la base de datos..."
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Base de datos conectada correctamente'); process.exit(0); }).catch((e) => { console.error('❌ Error:', e.message); process.exit(1); });"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ¡Backend arreglado exitosamente!"
    echo ""
    echo "Ahora puedes ejecutar:"
    echo "  bun run start"
    echo ""
else
    echo "❌ Hubo un problema al verificar la conexión"
    exit 1
fi
