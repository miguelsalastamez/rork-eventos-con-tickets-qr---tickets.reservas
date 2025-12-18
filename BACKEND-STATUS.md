# 🔍 Estado del Backend - Diagnóstico

## ⚠️ Problemas Encontrados

### 1. **Archivo `.env` No Configurado** 🔴 CRÍTICO
El backend requiere un archivo `.env` con la configuración necesaria, pero actualmente **no existe**.

**Impacto:**
- ❌ No hay conexión a base de datos
- ❌ JWT Secret usando valor por defecto inseguro
- ❌ URL del API no configurada

**Solución:**
```bash
# 1. Copia el archivo de ejemplo
cp env.example .env

# 2. Edita .env y configura:
#    - DATABASE_URL con tu conexión a PostgreSQL
#    - JWT_SECRET con un valor seguro
#    - EXPO_PUBLIC_RORK_API_BASE_URL con la URL del servidor
```

### 2. **Base de Datos No Inicializada** 🔴 CRÍTICO
La base de datos PostgreSQL no ha sido migrada.

**Solución:**
```bash
# Ejecuta las migraciones de Prisma
bunx prisma migrate dev

# Opcional: Verifica el estado
bunx prisma studio
```

### 3. **Queries de React Query Deshabilitadas** 🟡 ARREGLADO
Los contextos tenían `enabled: false`, impidiendo que se ejecutaran automáticamente.

**Estado:** ✅ Ya corregido en:
- `contexts/UserContext.tsx`
- `contexts/EventContext.tsx`

### 4. **Manejo de Errores Mejorado** 🟢 ARREGLADO
El cliente tRPC ahora muestra mensajes de error más claros y útiles.

**Estado:** ✅ Mejorado en `lib/trpc.ts`

## 📋 Pasos para Hacer Funcionar el Backend

### Opción A: Configurar Backend Local (Recomendado)

```bash
# 1. Instala PostgreSQL si no lo tienes
# macOS: brew install postgresql@14
# Windows: Descarga desde postgresql.org
# Linux: sudo apt install postgresql-14

# 2. Crea la base de datos
createdb eventos_app

# 3. Copia y configura .env
cp env.example .env

# Edita .env con:
DATABASE_URL="postgresql://postgres:password@localhost:5432/eventos_app?schema=public"
JWT_SECRET="$(openssl rand -base64 32)"
EXPO_PUBLIC_RORK_API_BASE_URL="http://localhost:8081"

# 4. Ejecuta las migraciones
bunx prisma migrate dev

# 5. Inicia el servidor
bun run start
```

### Opción B: Base de Datos en la Nube (Más fácil)

Usa un servicio como **Supabase** (gratis):

1. Ve a https://supabase.com
2. Crea un nuevo proyecto
3. Copia el "Connection String" desde Settings → Database
4. Pégalo en tu `.env`:

```bash
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]?pgbouncer=true"
JWT_SECRET="$(openssl rand -base64 32)"
EXPO_PUBLIC_RORK_API_BASE_URL="http://localhost:8081"
```

5. Ejecuta: `bunx prisma migrate dev`

## 🧪 Verificar que Funcione

```bash
# 1. Verifica que el servidor responda
curl http://localhost:8081/

# Deberías ver:
# {"status":"ok","message":"API is running","database":"connected"}

# 2. Verifica la salud del API
curl http://localhost:8081/api/health

# 3. En la consola del servidor deberías ver:
# ✅ All systems ready!
```

## 📱 App en Móvil

**Problema:** "La app no se actualiza en el celular"

**Causa:** El backend debe estar accesible desde el dispositivo móvil.

**Solución:**

```bash
# Opción 1: Usar túnel (más fácil)
bun run start  # Ya incluye --tunnel

# Opción 2: Usar IP local
# 1. Encuentra tu IP local:
#    macOS/Linux: ifconfig | grep "inet "
#    Windows: ipconfig

# 2. Actualiza .env:
EXPO_PUBLIC_RORK_API_BASE_URL="http://TU_IP_LOCAL:8081"

# 3. Reinicia el servidor
```

## 🔄 Cambios Realizados

### ✅ `contexts/UserContext.tsx`
- Activadas las queries automáticamente
- Agregado retry con delay
- `organizationsQuery` se habilita solo si hay usuario

### ✅ `contexts/EventContext.tsx`
- Activadas todas las queries automáticamente
- Agregado retry con delay para mejor manejo de errores

### ✅ `lib/trpc.ts`
- Mejorados mensajes de error
- Detecta problemas de conexión
- Mensajes en español más claros

### ✅ `backend/hono.ts`
- Mejor logging al iniciar
- Información clara sobre el estado del sistema
- Guías de solución en la consola

## 📝 Próximos Pasos Recomendados

1. **Configurar `.env`** - El paso más importante
2. **Migrar la base de datos** - `bunx prisma migrate dev`
3. **Crear usuario de prueba** - Usar la función `createTestUser` del backend
4. **Probar en la app** - Verificar que todo funcione

## 🆘 Solución de Problemas Comunes

### Error: "No se pudo conectar al backend"
- ✅ Verifica que el servidor esté corriendo
- ✅ Verifica la URL en `EXPO_PUBLIC_RORK_API_BASE_URL`
- ✅ Si estás en móvil, usa túnel o IP local

### Error: "Database not connected"
- ✅ Verifica que PostgreSQL esté corriendo
- ✅ Verifica la `DATABASE_URL` en `.env`
- ✅ Ejecuta `bunx prisma migrate dev`

### Error: "Token inválido"
- ✅ Configura un `JWT_SECRET` único en `.env`
- ✅ Cierra sesión y vuelve a iniciar sesión

### La app se cierra en el móvil
- ✅ Revisa los logs con: `bun run start`
- ✅ Verifica que no haya errores de TypeScript
- ✅ Verifica que el backend esté accesible desde el móvil
