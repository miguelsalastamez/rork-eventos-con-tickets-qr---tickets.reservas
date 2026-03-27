# Migración a Base de Datos PostgreSQL

## ¿Qué Cambió?

### Antes (AsyncStorage)
- Los datos se guardaban localmente en cada dispositivo
- No había sincronización entre dispositivos
- Los eventos creados en un dispositivo no aparecían en otros
- Los datos se perdían si se desinstalaba la app

### Ahora (PostgreSQL + tRPC)
- ✅ Todos los datos se guardan en una base de datos centralizada
- ✅ Sincronización automática entre todos los dispositivos
- ✅ Los eventos son accesibles desde cualquier dispositivo
- ✅ Los datos persisten incluso si se desinstala la app
- ✅ Sistema de autenticación con usuarios y permisos
- ✅ Control de acceso basado en roles

## Configuración Requerida

### 1. Instalar PostgreSQL

**En tu computadora (desarrollo):**

#### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Windows
Descarga desde: https://www.postgresapp.com/ o https://www.postgresql.org/download/windows/

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql postgres

# Dentro de psql:
CREATE DATABASE eventos_app;
CREATE USER eventos_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE eventos_app TO eventos_user;
\q
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://eventos_user:tu_password@localhost:5432/eventos_app?schema=public"
JWT_SECRET="$(openssl rand -base64 32)"
EXPO_PUBLIC_API_URL="http://localhost:8081/api"
EXPO_PUBLIC_TOOLKIT_URL="https://toolkit.rork.com"
PORT=8081
NODE_ENV=development
```

### 4. Ejecutar Migraciones

```bash
# Generar cliente Prisma
bunx prisma generate

# Crear tablas en la base de datos
bunx prisma db push

# (Opcional) Ver la base de datos
bunx prisma studio
```

## Esquema de Base de Datos

### Tablas Principales

#### Users (Usuarios)
- `id`: ID único
- `email`: Email (único)
- `password`: Contraseña (hasheada)
- `fullName`: Nombre completo
- `role`: Rol (super_admin, seller_admin, collaborator, viewer)
- `organizationId`: ID de organización (opcional)

#### Organizations (Organizaciones)
- `id`: ID único
- `name`: Nombre
- `createdAt`: Fecha de creación

#### Events (Eventos)
- `id`: ID único
- `name`: Nombre del evento
- `description`: Descripción
- `date`: Fecha del evento
- `time`: Hora
- `venueName`: Nombre del lugar
- `location`: Ubicación
- `imageUrl`: URL de imagen
- `organizerLogoUrl`: Logo del organizador
- `venuePlanUrl`: Plano del lugar
- `createdBy`: ID del usuario creador
- `organizationId`: ID de organización

#### Attendees (Asistentes)
- `id`: ID único
- `eventId`: ID del evento
- `fullName`: Nombre completo
- `email`: Email
- `employeeNumber`: Número de empleado
- `ticketCode`: Código de ticket (único)
- `checkedIn`: Estado de check-in
- `checkedInAt`: Fecha de check-in

#### Tickets (Tickets)
- `id`: ID único
- `eventId`: ID del evento
- `name`: Nombre del ticket
- `description`: Descripción
- `price`: Precio
- `currency`: Moneda
- `capacityType`: Tipo de capacidad (unlimited, dedicated, shared)
- `soldCount`: Cantidad vendida
- `saleStartDate`: Fecha inicio de venta
- `saleEndDate`: Fecha fin de venta
- `isActive`: Activo/Inactivo

#### Purchases (Compras)
- `id`: ID único
- `eventId`: ID del evento
- `ticketId`: ID del ticket
- `userId`: ID del usuario comprador
- `quantity`: Cantidad
- `totalAmount`: Monto total
- `paymentMethod`: Método de pago (stripe, transfer)
- `status`: Estado (pending, completed, etc.)
- `purchasedAt`: Fecha de compra

#### Prizes (Premios)
- `id`: ID único
- `eventId`: ID del evento
- `name`: Nombre del premio
- `description`: Descripción
- `quantity`: Cantidad

#### RaffleWinners (Ganadores de Rifa)
- `id`: ID único
- `eventId`: ID del evento
- `prizeId`: ID del premio
- `attendeeId`: ID del asistente
- `wonAt`: Fecha que ganó

#### CapacityPools (Pools de Capacidad)
- `id`: ID único
- `eventId`: ID del evento
- `name`: Nombre
- `totalCapacity`: Capacidad total
- `usedCapacity`: Capacidad usada

#### Messages (Mensajes)
- `id`: ID único
- `eventId`: ID del evento
- `subject`: Asunto
- `content`: Contenido
- `sentBy`: Enviado por (ID de usuario)
- `sentAt`: Fecha de envío

## Sistema de Permisos

### Verificación en el Backend

Todas las operaciones verifican permisos antes de ejecutarse:

```typescript
// Ejemplo: Solo el creador o admin puede editar
if (!canUserEditEvent(ctx.user.id, event.createdBy, ctx.user.role)) {
  throw new TRPCError({ 
    code: 'FORBIDDEN', 
    message: 'No tienes permiso para editar este evento' 
  });
}
```

### Reglas de Negocio

1. **Crear eventos**: Solo `super_admin` y `seller_admin`
2. **Editar eventos**: Creador, colaboradores, o admins
3. **Eliminar eventos**: Solo creador o admins
4. **Ver eventos**: Todos los roles
5. **Gestionar asistentes**: Colaboradores y admins
6. **Comprar tickets**: Cualquier usuario (público)

## Migración de Datos Existentes

Si ya tienes datos en AsyncStorage y quieres migrarlos:

### 1. Exportar Datos de AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

async function exportData() {
  const events = await AsyncStorage.getItem('@events');
  const attendees = await AsyncStorage.getItem('@attendees');
  
  console.log('Events:', events);
  console.log('Attendees:', attendees);
}
```

### 2. Importar a PostgreSQL

Crea un script o usa Prisma para insertar los datos:

```typescript
import { prisma } from './backend/lib/prisma';

async function importEvents(oldEvents) {
  for (const event of oldEvents) {
    await prisma.event.create({
      data: {
        name: event.name,
        description: event.description,
        date: new Date(event.date),
        time: event.time,
        venueName: event.venueName,
        location: event.location,
        imageUrl: event.imageUrl,
        createdBy: 'USER_ID', // Reemplaza con un ID de usuario real
      },
    });
  }
}
```

## Ventajas del Sistema Actual

### 1. Sincronización Real
- Los eventos creados en web aparecen inmediatamente en mobile
- Los check-ins se sincronizan en tiempo real
- Múltiples usuarios pueden trabajar simultáneamente

### 2. Seguridad
- Autenticación con JWT
- Contraseñas hasheadas con bcrypt
- Verificación de permisos en cada operación
- Protección contra accesos no autorizados

### 3. Escalabilidad
- Puede manejar miles de eventos y usuarios
- Base de datos optimizada con índices
- Queries eficientes con Prisma

### 4. Auditoría
- Registro de quién creó cada evento
- Timestamps de creación y actualización
- Historial de compras y check-ins

### 5. Relaciones de Datos
- Un evento tiene muchos asistentes
- Un evento tiene muchos tickets
- Un usuario pertenece a una organización
- Integridad referencial garantizada

## Comandos Útiles de Prisma

```bash
# Ver la base de datos en el navegador
bunx prisma studio

# Resetear la base de datos (¡CUIDADO! Borra todos los datos)
bunx prisma db push --force-reset

# Generar SQL de las migraciones
bunx prisma migrate dev --name init

# Ver el esquema actual
bunx prisma db pull

# Formatear schema.prisma
bunx prisma format
```

## Troubleshooting

### Error: "Can't reach database server"
- Verifica que PostgreSQL esté corriendo: `brew services list` (macOS)
- Verifica el puerto: `lsof -i :5432`
- Verifica la URL de conexión en `.env`

### Error: "Invalid authentication"
- Verifica usuario y contraseña en `.env`
- Recrea el usuario en PostgreSQL

### Error: "Database does not exist"
```bash
createdb eventos_app
```

### Los datos no se guardan
- Verifica que el backend esté corriendo
- Revisa los logs: `pm2 logs` o `bun run start`
- Verifica que la URL del API sea correcta en `.env`

### Quiero empezar de cero
```bash
bunx prisma db push --force-reset
bunx prisma generate
```
