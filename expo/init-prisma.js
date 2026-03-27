#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Initializing Prisma Client...\n');

try {
  const prismaClientPath = path.join(__dirname, 'node_modules', '@prisma', 'client');
  
  if (!fs.existsSync(prismaClientPath) || !fs.existsSync(path.join(prismaClientPath, 'index.js'))) {
    console.log('📦 Prisma Client not found, generating...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Prisma Client generated successfully!\n');
  } else {
    console.log('✅ Prisma Client already exists\n');
  }
} catch (error) {
  console.error('❌ Failed to generate Prisma Client:', error.message);
  console.error('\nPlease run manually: npx prisma generate\n');
  process.exit(1);
}
