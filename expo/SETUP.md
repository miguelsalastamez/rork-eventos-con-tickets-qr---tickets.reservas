# Guía de Configuración del Proyecto

## Configuración Inicial

### 1. Instalar Dependencias
```bash
bun install
```

### 2. Configurar Base de Datos

Crea un archivo `.env` en la raíz del proyecto:
```bash
cp .env.example .env
```

Edita el archivo `.env` y configura la URL de tu base de datos PostgreSQL:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_db?schema=public"
JWT_SECRET="genera-uno-con-openssl-rand-base64-32"
EXPO_PUBLIC_API_URL="http://localhost:8081/api"
```

### 3. Inicializar Prisma y la Base de Datos

```bash
# Generar el cliente de Prisma
bunx prisma generate

# Crear las tablas en la base de datos
bunx prisma db push

# (Opcional) Abrir Prisma Studio para ver la base de datos
bunx prisma studio
```

### 4. Iniciar el Servidor de Desarrollo

```bash
bun run start
```

La aplicación estará disponible en:
- Web: http://localhost:8081
- API: http://localhost:8081/api
- tRPC: http://localhost:8081/api/trpc

## Arquitectura del Sistema

### Backend (tRPC + Prisma + PostgreSQL)

El backend está construido con:
- **Hono**: Framework web ligero
- **tRPC**: API type-safe
- **Prisma**: ORM para PostgreSQL
- **JWT**: Autenticación con tokens

#### Rutas Disponibles

**Autenticación** (`/api/trpc/auth.*`)
- `auth.register`: Registrar nuevo usuario
- `auth.login`: Iniciar sesión
- `auth.me`: Obtener usuario actual (requiere autenticación)
- `auth.createTestUser`: Crear usuario de prueba

### Sistema de Permisos

#### Roles de Usuario

1. **super_admin**: Acceso total al sistema
2. **seller_admin**: Admin de organización (puede crear/editar/eliminar eventos)
3. **collaborator**: Puede editar eventos y gestionar asistentes (no puede crear/eliminar)
4. **viewer**: Solo puede ver reportes

#### Permisos por Rol

| Permiso | super_admin | seller_admin | collaborator | viewer |
|---------|-------------|--------------|--------------|--------|
| Crear eventos | ✅ | ✅ | ❌ | ❌ |
| Editar eventos | ✅ | ✅ | ✅ | ❌ |
| Eliminar eventos | ✅ | ✅ | ❌ | ❌ |
| Gestionar asistentes | ✅ | ✅ | ✅ | ❌ |
| Check-in asistentes | ✅ | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ✅ | ✅ | ✅ |
| Enviar mensajes | ✅ | ✅ | ✅ | ❌ |

### Frontend (React Native + Expo)

El frontend está construido con:
- **Expo**: Framework de React Native
- **React Query**: Gestión de estado del servidor
- **tRPC**: Cliente type-safe para el API
- **AsyncStorage**: Persistencia local (fallback)

#### Contextos

1. **UserContext**: Usuario actual y permisos
2. **EventContext**: Eventos y asistentes
3. **TicketContext**: Tickets y compras
4. **SettingsContext**: Configuración de la app

## Flujo de Autenticación

### 1. Registro/Login
```typescript
// Ejemplo de registro
const { mutate: register } = trpc.auth.register.useMutation();

register({
  email: 'usuario@ejemplo.com',
  password: 'password123',
  fullName: 'Juan Pérez',
  role: 'seller_admin',
});
```

### 2. Almacenar Token
El token JWT se guarda en AsyncStorage y se incluye en todas las peticiones:
```typescript
// En el cliente tRPC
headers: {
  authorization: `Bearer ${token}`,
}
```

### 3. Verificación de Permisos
El backend verifica el token en cada petición protegida y devuelve el usuario:
```typescript
// En protectedProcedure
if (!ctx.user) {
  throw new TRPCError({ code: 'UNAUTHORIZED' });
}
```

## Crear Usuarios de Prueba

### Opción 1: Usar el endpoint de test
```typescript
const { mutate } = trpc.auth.createTestUser.useMutation();

mutate({ role: 'seller_admin' });
// Devuelve: { user, token, credentials: { email, password } }
```

### Opción 2: Usar Prisma Studio
```bash
bunx prisma studio
```
Navega a la tabla `User` y crea un usuario manualmente.

### Opción 3: Script de seed
Crea un archivo `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../backend/lib/auth';

const prisma = new PrismaClient();

async function main() {
  const password = await hashPassword('admin123');
  
  await prisma.user.create({
    data: {
      email: 'admin@ejemplo.com',
      password,
      fullName: 'Administrador',
      role: 'super_admin',
    },
  });
}

main();
```

Ejecuta:
```bash
bunx tsx prisma/seed.ts
```

## Sincronización entre Plataformas

Los datos ahora se sincronizan automáticamente porque:
1. Todo se guarda en PostgreSQL (base de datos centralizada)
2. El frontend hace peticiones al backend vía tRPC
3. React Query mantiene los datos sincronizados en el cliente

**Antes (AsyncStorage)**:
- Los datos solo existían localmente en cada dispositivo
- No había sincronización entre dispositivos

**Ahora (PostgreSQL + tRPC)**:
- Los datos se guardan en el servidor
- Todos los dispositivos leen/escriben de la misma base de datos
- Sincronización automática en tiempo real

## Subida de Imágenes

Las imágenes ahora se optimizan automáticamente con `expo-image-manipulator`:
1. El usuario selecciona una imagen
2. Se redimensiona y comprime
3. Se convierte a base64
4. Se envía al servidor
5. El servidor la guarda optimizada

## Testing

### Probar Autenticación
```bash
curl -X POST http://localhost:8081/api/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "password123",
    "fullName": "Usuario Test"
  }'
```

### Probar Endpoint Protegido
```bash
curl http://localhost:8081/api/trpc/auth.me \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

## Troubleshooting

### Error: Cannot connect to database
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que la base de datos exista

### Error: Prisma Client not found
```bash
bunx prisma generate
```

### Error: Table does not exist
```bash
bunx prisma db push
```

### Los datos no se sincronizan
- Verifica que el backend esté corriendo
- Verifica la variable `EXPO_PUBLIC_API_URL` en `.env`
- Revisa los logs del servidor para ver errores

### Error de CORS
Asegúrate de que el backend tenga configurado CORS (ya está en `backend/hono.ts`).

## Próximos Pasos

1. **Implementar rutas tRPC para eventos** (en progreso)
2. **Implementar rutas tRPC para tickets**
3. **Migrar los contextos para usar tRPC en lugar de AsyncStorage**
4. **Añadir validación de permisos en todas las operaciones**
5. **Implementar sistema de organizaciones**
6. **Añadir tests automatizados**
