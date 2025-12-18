# 🛠️ Cómo Arreglar el Error del Backend

## ❌ Error Actual

```
❌ Backend error: Server did not start
Text strings must be rendered within a <Text> component
```

## 📋 Causa del Problema

El backend no puede iniciar porque la **base de datos SQLite no ha sido inicializada**. Prisma necesita ejecutar las migraciones para crear el archivo `dev.db` con todas las tablas.

## ✅ Solución Rápida (3 pasos)

### Paso 1: Generar el Cliente de Prisma

```bash
bunx prisma generate
```

Este comando genera el cliente de Prisma que permite interactuar con la base de datos.

### Paso 2: Crear la Base de Datos

```bash
bunx prisma migrate dev --name init
```

Este comando:
- Crea el archivo `dev.db` (base de datos SQLite)
- Ejecuta todas las migraciones para crear las tablas
- Genera el esquema completo

### Paso 3: Reiniciar el Servidor

```bash
bun run start
```

El backend debería iniciar correctamente y verás:
```
✅ All systems ready!
🚀 Server running on http://localhost:8081
```

## 🎯 Crear Datos de Prueba (Opcional pero Recomendado)

Una vez que el backend esté funcionando, puedes crear datos de prueba completos:

1. Abre la app en tu dispositivo
2. Toca el botón del usuario (👤) en la esquina superior derecha
3. Ve a "Admin" (solo si eres super_admin)
4. Selecciona "Gestión de Datos de Prueba"
5. Toca "Crear Datos de Prueba"

Esto creará:
- ✅ 4 organizaciones (tiendas)
- ✅ 8 eventos completos
- ✅ Múltiples tickets con precios
- ✅ 100+ asistentes
- ✅ Premios para rifas

## 🔍 Verificar que Todo Funciona

### 1. Verificar el Backend

```bash
curl http://localhost:8081/
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "API is running",
  "database": "connected"
}
```

### 2. Verificar la Base de Datos

```bash
bunx prisma studio
```

Esto abre una interfaz visual donde puedes ver todas las tablas y datos.

### 3. Ver los Logs del Servidor

En la terminal donde ejecutas `bun run start`, deberías ver:

```
==================================================
🚀 BACKEND SERVER STARTING
==================================================
📦 Environment: production
🔧 Database URL configured: true
💾 Database connected: true
🔐 JWT Secret configured: true

✅ All systems ready!
==================================================

🚀 Server running on http://localhost:8081
🔌 API endpoint: http://localhost:8081/api
📡 tRPC endpoint: http://localhost:8081/api/trpc
```

## 🚨 Problemas Comunes

### Error: "Prisma Client is not generated"

**Solución:**
```bash
bunx prisma generate
```

### Error: "No se pudo conectar al backend"

**Causas posibles:**
1. El servidor backend no está corriendo → Ejecuta `bun run start`
2. Puerto 8081 ocupado → Cambia el puerto en `.env`
3. Firewall bloqueando conexiones → Verifica configuración

### Error: "Database locked"

**Solución:**
```bash
# Detén el servidor
# Elimina la base de datos
rm dev.db dev.db-journal

# Vuelve a crear la base de datos
bunx prisma migrate dev --name init
```

### La App se Cierra en el Móvil

**Solución:**
1. Verifica que el backend esté accesible desde el móvil
2. El comando `bun run start` incluye `--tunnel` que expone el servidor
3. Verifica la URL en los logs después de iniciar

## 📚 Recursos Adicionales

- `BACKEND-STATUS.md` - Diagnóstico completo del backend
- `README-DATABASE.md` - Información sobre la base de datos
- `SETUP.md` - Guía de configuración completa
- `check-backend.js` - Script para verificar configuración

## ✨ ¿Todo Funcionando?

Si seguiste estos pasos, tu backend debería estar funcionando correctamente y podrás:

- ✅ Ver la lista de eventos
- ✅ Crear nuevos eventos
- ✅ Gestionar asistentes
- ✅ Crear y gestionar tiendas
- ✅ Comprar tickets
- ✅ Realizar rifas

¡Listo para usar! 🎉
