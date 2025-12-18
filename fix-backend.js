#!/usr/bin/env node

console.log('\n' + '='.repeat(70));
console.log('🔧 ARREGLANDO EL BACKEND AUTOMÁTICAMENTE');
console.log('='.repeat(70) + '\n');

const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  console.log(`   Ejecutando: ${command}\n`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`   ✅ ${description} completado\n`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error en: ${description}`);
    console.error(`   ${error.message}\n`);
    return false;
  }
}

async function main() {
  // Paso 1: Verificar que existe .env
  console.log('1️⃣  Verificando archivo .env...');
  if (!fs.existsSync('.env')) {
    console.log('   ⚠️  .env no existe, copiando de env.example');
    fs.copyFileSync('env.example', '.env');
    console.log('   ✅ Archivo .env creado\n');
  } else {
    console.log('   ✅ Archivo .env existe\n');
  }

  // Paso 2: Generar cliente de Prisma
  const generateSuccess = runCommand(
    'bunx prisma generate',
    'Generando cliente de Prisma'
  );
  
  if (!generateSuccess) {
    console.error('\n❌ No se pudo generar el cliente de Prisma');
    console.log('   Intenta manualmente: bunx prisma generate\n');
    process.exit(1);
  }

  // Paso 3: Ejecutar migraciones
  const migrateSuccess = runCommand(
    'bunx prisma migrate dev --name init',
    'Creando base de datos y ejecutando migraciones'
  );
  
  if (!migrateSuccess) {
    console.error('\n❌ No se pudieron ejecutar las migraciones');
    console.log('   Intenta manualmente: bunx prisma migrate dev --name init\n');
    process.exit(1);
  }

  // Éxito
  console.log('='.repeat(70));
  console.log('✅ ¡BACKEND ARREGLADO EXITOSAMENTE!');
  console.log('='.repeat(70) + '\n');
  
  console.log('🎉 Todo listo. Ahora puedes:');
  console.log('   1. Iniciar el servidor: bun run start');
  console.log('   2. Crear datos de prueba desde la app');
  console.log('   3. Ver la base de datos: bunx prisma studio\n');
  
  console.log('📖 Para más información, lee: COMO-ARREGLAR-BACKEND.md\n');
}

main().catch(error => {
  console.error('\n❌ Error inesperado:', error);
  process.exit(1);
});
