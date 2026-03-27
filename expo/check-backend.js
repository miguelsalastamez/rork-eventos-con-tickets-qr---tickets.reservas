#!/usr/bin/env node

console.log('\n' + '='.repeat(60));
console.log('🔍 VERIFICACIÓN DEL ESTADO DEL BACKEND');
console.log('='.repeat(60) + '\n');

const fs = require('fs');
const path = require('path');

let hasErrors = false;
let hasWarnings = false;

console.log('📋 Verificando configuración...\n');

// 1. Verificar .env
console.log('1️⃣  Verificando archivo .env');
if (!fs.existsSync('.env')) {
  console.error('   ❌ FALTA: No existe el archivo .env');
  console.log('   💡 Solución: cp env.example .env\n');
  hasErrors = true;
} else {
  console.log('   ✅ Existe el archivo .env');
  
  const envContent = fs.readFileSync('.env', 'utf-8');
  
  // Verificar DATABASE_URL
  if (!envContent.includes('DATABASE_URL=') || envContent.includes('DATABASE_URL=""')) {
    console.error('   ❌ FALTA: DATABASE_URL no configurado');
    hasErrors = true;
  } else {
    console.log('   ✅ DATABASE_URL configurado');
  }
  
  // Verificar JWT_SECRET
  if (!envContent.includes('JWT_SECRET=') || 
      envContent.includes('JWT_SECRET=""') ||
      envContent.includes('cambia-esto-por-un-secreto-seguro')) {
    console.warn('   ⚠️  ADVERTENCIA: JWT_SECRET usando valor por defecto');
    console.log('   💡 Solución: openssl rand -base64 32');
    hasWarnings = true;
  } else {
    console.log('   ✅ JWT_SECRET configurado');
  }
  
  // Verificar EXPO_PUBLIC_RORK_API_BASE_URL
  if (!envContent.includes('EXPO_PUBLIC_RORK_API_BASE_URL=')) {
    console.warn('   ⚠️  ADVERTENCIA: EXPO_PUBLIC_RORK_API_BASE_URL no configurado');
    hasWarnings = true;
  } else {
    console.log('   ✅ EXPO_PUBLIC_RORK_API_BASE_URL configurado');
  }
  
  console.log('');
}

// 2. Verificar node_modules
console.log('2️⃣  Verificando dependencias');
if (!fs.existsSync('node_modules')) {
  console.error('   ❌ FALTA: node_modules no existe');
  console.log('   💡 Solución: bun install\n');
  hasErrors = true;
} else {
  console.log('   ✅ Dependencias instaladas\n');
}

// 3. Verificar Prisma
console.log('3️⃣  Verificando Prisma');
if (!fs.existsSync('node_modules/.prisma/client')) {
  console.error('   ❌ FALTA: Cliente de Prisma no generado');
  console.log('   💡 Solución: bunx prisma generate\n');
  hasErrors = true;
} else {
  console.log('   ✅ Cliente de Prisma generado\n');
}

// 4. Verificar migraciones
console.log('4️⃣  Verificando migraciones de base de datos');
const migrationsDir = path.join('prisma', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.warn('   ⚠️  ADVERTENCIA: No hay carpeta de migraciones');
  console.log('   💡 Solución: bunx prisma migrate dev\n');
  hasWarnings = true;
} else {
  const migrations = fs.readdirSync(migrationsDir).filter(f => f !== 'migration_lock.toml');
  if (migrations.length === 0) {
    console.warn('   ⚠️  ADVERTENCIA: No hay migraciones ejecutadas');
    console.log('   💡 Solución: bunx prisma migrate dev\n');
    hasWarnings = true;
  } else {
    console.log(`   ✅ ${migrations.length} migración(es) encontrada(s)\n`);
  }
}

// 5. Verificar estructura del backend
console.log('5️⃣  Verificando estructura del backend');
const backendFiles = [
  'backend/hono.ts',
  'backend/trpc/app-router.ts',
  'backend/trpc/create-context.ts',
  'backend/lib/prisma.ts',
  'backend/lib/auth.ts',
];

let allFilesExist = true;
for (const file of backendFiles) {
  if (!fs.existsSync(file)) {
    console.error(`   ❌ FALTA: ${file}`);
    allFilesExist = false;
    hasErrors = true;
  }
}

if (allFilesExist) {
  console.log('   ✅ Todos los archivos del backend presentes\n');
}

// Resumen
console.log('='.repeat(60));
console.log('📊 RESUMEN');
console.log('='.repeat(60) + '\n');

if (hasErrors) {
  console.error('❌ Se encontraron errores críticos que deben corregirse.\n');
  console.log('📖 Lee BACKEND-STATUS.md para instrucciones detalladas.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  Todo funcional pero hay advertencias.\n');
  console.log('📖 Lee BACKEND-STATUS.md para optimizar tu configuración.\n');
  process.exit(0);
} else {
  console.log('✅ ¡Todo configurado correctamente!\n');
  console.log('🚀 Puedes iniciar el servidor con: bun run start\n');
  process.exit(0);
}
