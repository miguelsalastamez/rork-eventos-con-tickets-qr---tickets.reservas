#!/usr/bin/env node

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('🛠️  Arreglando el Backend...\n');

function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n${description}...`);
    console.log(`Ejecutando: ${command} ${args.join(' ')}\n`);
    
    const proc = spawn(command, args, { 
      stdio: 'inherit',
      shell: true 
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} - Completado\n`);
        resolve();
      } else {
        console.error(`❌ ${description} - Error (código ${code})\n`);
        reject(new Error(`${description} falló con código ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      console.error(`❌ Error al ejecutar ${command}:`, err.message);
      reject(err);
    });
  });
}

async function fixBackend() {
  try {
    // Paso 1: Generar Cliente de Prisma
    console.log('📦 Paso 1/3: Generando Cliente de Prisma');
    await runCommand('bunx', ['prisma', 'generate'], 'Generación del Cliente de Prisma');
    
    // Paso 2: Ejecutar Migraciones
    console.log('\n🗄️  Paso 2/3: Creando/Actualizando Base de Datos');
    await runCommand('bunx', ['prisma', 'migrate', 'dev', '--name', 'init'], 'Migración de Base de Datos');
    
    // Paso 3: Verificar archivo de base de datos
    console.log('\n🔍 Paso 3/3: Verificando Base de Datos');
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    
    if (existsSync(dbPath)) {
      console.log(`✅ Archivo de base de datos encontrado: ${dbPath}`);
    } else {
      console.warn(`⚠️  Advertencia: No se encontró el archivo de base de datos en ${dbPath}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡Backend arreglado exitosamente!');
    console.log('='.repeat(60));
    console.log('\n📝 Próximos pasos:\n');
    console.log('  1. Ejecuta el servidor:');
    console.log('     bun run start\n');
    console.log('  2. Verifica que el backend esté funcionando:');
    console.log('     curl http://localhost:8081/\n');
    console.log('  3. (Opcional) Crea datos de prueba desde la app:');
    console.log('     Admin → Gestión de Datos de Prueba → Crear Datos\n');
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Error al arreglar el backend');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\n📚 Consulta COMO-ARREGLAR-BACKEND.md para más ayuda\n');
    process.exit(1);
  }
}

fixBackend();
