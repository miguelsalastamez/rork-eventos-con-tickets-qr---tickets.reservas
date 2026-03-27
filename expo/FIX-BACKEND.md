# 🔧 Fix del Error del Backend / Backend Error Fix

## 🇪🇸 Español

### Problema
El backend no inicia porque la base de datos SQLite no está inicializada.

### Solución Rápida (Opción Automática)
```bash
node fix-backend.js
```

Este script hace todo automáticamente:
- ✅ Verifica el archivo .env
- ✅ Genera el cliente de Prisma  
- ✅ Crea la base de datos
- ✅ Ejecuta las migraciones

### Solución Manual (3 comandos)
```bash
# 1. Generar cliente de Prisma
bunx prisma generate

# 2. Crear base de datos
bunx prisma migrate dev --name init

# 3. Iniciar servidor
bun run start
```

### Después de Arreglar
1. El backend debería iniciar en http://localhost:8081
2. Puedes crear datos de prueba desde la app:
   - Toca el botón de usuario 👤
   - Ve a "Admin" → "Gestión de Datos de Prueba"
   - Toca "Crear Datos de Prueba"

### Más Información
Lee `COMO-ARREGLAR-BACKEND.md` para detalles completos.

---

## 🇺🇸 English

### Problem
The backend won't start because the SQLite database hasn't been initialized.

### Quick Fix (Automatic Option)
```bash
node fix-backend.js
```

This script does everything automatically:
- ✅ Verifies .env file
- ✅ Generates Prisma client
- ✅ Creates database
- ✅ Runs migrations

### Manual Fix (3 commands)
```bash
# 1. Generate Prisma client
bunx prisma generate

# 2. Create database
bunx prisma migrate dev --name init

# 3. Start server
bun run start
```

### After Fixing
1. Backend should start at http://localhost:8081
2. You can create test data from the app:
   - Tap the user button 👤
   - Go to "Admin" → "Test Data Management"
   - Tap "Create Test Data"

### More Information
Read `COMO-ARREGLAR-BACKEND.md` for complete details.

---

## 🚀 Quick Commands Reference

```bash
# Fix backend automatically
node fix-backend.js

# Check backend status
node check-backend.js

# Start server
bun run start

# View database
bunx prisma studio

# Reset database (if needed)
rm dev.db dev.db-journal
bunx prisma migrate dev --name init
```

---

## 📁 Archivos de Ayuda / Help Files

- `fix-backend.js` - Script automático para arreglar el backend
- `COMO-ARREGLAR-BACKEND.md` - Guía completa en español
- `BACKEND-STATUS.md` - Diagnóstico del estado del backend
- `check-backend.js` - Verificar configuración
- `README-DATABASE.md` - Información sobre la base de datos

---

## ✅ Verificación / Verification

Después de ejecutar el fix, verifica que todo funciona:

```bash
# Test the backend
curl http://localhost:8081/

# Should return:
# {"status":"ok","message":"API is running","database":"connected"}
```

Si ves `"database":"connected"`, ¡todo está listo! 🎉
