# 🚨 ARREGLAR BACKEND - SOLUCIÓN INMEDIATA

## ❌ Error Actual
```
❌ Backend error: Server did not start
```

## 🎯 Solución Rápida (Elige una opción)

### Opción 1: Script Automático (RECOMENDADO) ⭐

Ejecuta este comando en tu terminal:

```bash
node fix-backend-startup.js
```

Este script automáticamente:
1. ✅ Genera el Cliente de Prisma
2. ✅ Crea la base de datos SQLite
3. ✅ Ejecuta todas las migraciones
4. ✅ Verifica que todo funcione

---

### Opción 2: Comandos Manuales (3 pasos)

Si prefieres hacerlo paso por paso:

#### Paso 1: Generar Cliente de Prisma
```bash
bunx prisma generate
```

#### Paso 2: Crear Base de Datos
```bash
bunx prisma migrate dev --name init
```

#### Paso 3: Iniciar Servidor
```bash
bun run start
```

---

## 🔍 ¿Por Qué Ocurre Este Error?

El backend no puede iniciar porque:

1. **Prisma Client no está generado** → No puede interactuar con la base de datos
2. **Base de datos no existe** → El archivo `prisma/dev.db` no se ha creado
3. **Migraciones no aplicadas** → Las tablas no existen en la base de datos

## ✅ Verificar que Funciona

### 1. Backend debe mostrar:
```
==================================================
🚀 BACKEND SERVER STARTING
==================================================
✅ All systems ready!
🚀 Server running on http://localhost:8081
```

### 2. Prueba la API:
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

### 3. Ver la Base de Datos:
```bash
bunx prisma studio
```

Esto abre una interfaz web para ver tus datos.

---

## 🎨 Crear Datos de Prueba (Siguiente Paso)

Una vez que el backend funcione, crea datos de demostración:

### Método 1: Desde la App (FÁCIL)
1. Abre la app
2. Toca el ícono de usuario (👤) arriba a la derecha
3. Ve a **"Admin"**
4. Selecciona **"Gestión de Datos de Prueba"**
5. Toca **"Crear Datos de Prueba"**

Esto creará:
- 🏢 4 organizaciones/tiendas
- 🎉 8 eventos completos
- 🎫 Múltiples tipos de tickets
- 👥 100+ asistentes registrados
- 🎁 Premios para rifas
- 💰 Compras de ejemplo

### Método 2: Desde el Backend (AVANZADO)
```bash
# Crear un usuario de prueba primero
curl -X POST http://localhost:8081/api/trpc/auth.createTestUser \
  -H "Content-Type: application/json" \
  -d '{"role":"super_admin"}'

# Luego desde la app, iniciar sesión y crear datos
```

---

## 🚨 Errores Comunes

### Error: "Prisma Client is not generated"
```bash
bunx prisma generate
```

### Error: "Port 8081 already in use"
```bash
# Encuentra el proceso
lsof -i :8081

# Mátalo
kill -9 <PID>

# O cambia el puerto en el archivo 'env':
PORT=8082
```

### Error: "Database is locked"
```bash
# Detén todos los procesos que usen la DB
# Luego reinicia desde cero:
rm prisma/dev.db prisma/dev.db-journal
bunx prisma migrate dev --name init
```

### El Backend Inicia pero no se Conecta desde la App

Verifica que el archivo `env` tenga:
```
EXPO_PUBLIC_RORK_API_BASE_URL="https://dev-92loqsix46yuo4fa4rjne.rorktest.dev"
```

Y que estés usando el comando con `--tunnel`:
```bash
bun run start
# Incluye: --tunnel automáticamente
```

---

## 📱 Probar en Móvil

1. Asegúrate que el backend esté corriendo
2. El comando `bun run start` automáticamente crea un túnel
3. Escanea el QR desde Expo Go
4. La app debería conectarse automáticamente

---

## 🆘 Si Nada Funciona

1. **Borra todo y empieza de nuevo:**
```bash
# Borrar base de datos
rm -rf prisma/dev.db prisma/dev.db-journal

# Borrar node_modules y reinstalar
rm -rf node_modules
bun install

# Regenerar Prisma
bunx prisma generate
bunx prisma migrate dev --name init

# Iniciar
bun run start
```

2. **Consulta los logs detallados:**
   - Revisa la terminal donde corre el backend
   - Busca mensajes de error específicos
   - Copia el error exacto para buscar ayuda

3. **Archivos de ayuda:**
   - `COMO-ARREGLAR-BACKEND.md` - Guía detallada
   - `BACKEND-STATUS.md` - Diagnóstico del backend
   - `README-DATABASE.md` - Info sobre la base de datos

---

## ✨ ¿Todo Funciona?

Si seguiste estos pasos, deberías poder:

- ✅ Ver la lista de eventos
- ✅ Crear nuevos eventos
- ✅ Gestionar asistentes
- ✅ Crear tiendas/organizaciones
- ✅ Vender tickets
- ✅ Hacer rifas

¡Listo para usar tu app! 🎉

---

## 📞 Ayuda Adicional

Si el error persiste:
1. Copia el error completo de la terminal
2. Revisa que todos los archivos existan:
   - `backend/hono.ts`
   - `backend/lib/prisma.ts`
   - `prisma/schema.prisma`
   - `env` (con las variables correctas)
3. Verifica la versión de Bun: `bun --version`
