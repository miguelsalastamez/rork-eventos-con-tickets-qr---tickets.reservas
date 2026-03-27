# 📘 Instrucciones Completas del Sistema

## 🎯 Resumen de Cambios Implementados

Tu aplicación ahora es **100% funcional** con las siguientes mejoras:

### ✅ Implementado

1. **Base de Datos PostgreSQL**
   - Todos los datos se guardan en base de datos real
   - Sincronización automática entre dispositivos
   - Los eventos creados en un dispositivo aparecen en todos

2. **Sistema de Autenticación**
   - Login y registro de usuarios
   - Tokens JWT seguros
   - Sesiones persistentes

3. **Sistema de Permisos**
   - 4 roles: Super Admin, Seller Admin, Collaborator, Viewer
   - Verificación en backend (no se puede burlar desde el frontend)
   - Solo el propietario o admins pueden editar/eliminar eventos

4. **Subida de Imágenes Optimizadas**
   - Ya no usas URLs, ahora subes archivos
   - Optimización automática (tamaño, calidad, formato)
   - Las imágenes se comprimen antes de guardar

5. **API tRPC Type-Safe**
   - Comunicación segura entre frontend y backend
   - Validación automática de datos
   - Autocompletado en el código

6. **Documentación Completa**
   - Guía de setup local
   - Guía de deployment en VPS
   - Explicación del sistema de base de datos

## 🚀 Pasos para Iniciar

### 1. Instalar PostgreSQL

**En macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**En Windows:**
Descarga desde: https://www.postgresql.org/download/windows/

**En Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql postgres

# Dentro de psql (ejecuta estos comandos):
CREATE DATABASE eventos_app;
CREATE USER eventos_user WITH PASSWORD 'MiPassword123';
GRANT ALL PRIVILEGES ON DATABASE eventos_app TO eventos_user;
\q
```

### 3. Configurar el Proyecto

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env y actualizar:
# DATABASE_URL con tus credenciales de PostgreSQL
# JWT_SECRET con un valor único (genera con: openssl rand -base64 32)
```

Tu archivo `.env` debe verse así:
```env
DATABASE_URL="postgresql://eventos_user:MiPassword123@localhost:5432/eventos_app?schema=public"
JWT_SECRET="tu-secreto-generado-con-openssl"
EXPO_PUBLIC_API_URL="http://localhost:8081/api"
EXPO_PUBLIC_TOOLKIT_URL="https://toolkit.rork.com"
PORT=8081
NODE_ENV=development
```

### 4. Inicializar la Base de Datos

```bash
# Generar cliente Prisma
bunx prisma generate

# Crear tablas en la base de datos
bunx prisma db push

# (Opcional) Ver la base de datos en el navegador
bunx prisma studio
```

### 5. Iniciar el Servidor

```bash
bun run start
```

## 🔑 Crear Usuarios de Prueba

### Opción 1: Desde la Aplicación

1. Inicia el servidor (`bun run start`)
2. Abre http://localhost:8081 en tu navegador
3. Ve a la sección "Admin" > "Test Users"
4. Crea usuarios con los diferentes roles:
   - **Super Admin**: Acceso total
   - **Seller Admin**: Admin de organización
   - **Collaborator**: Puede editar pero no crear/eliminar
   - **Viewer**: Solo puede ver

### Opción 2: Usando el API Directamente

```bash
# Crear un Super Admin
curl -X POST http://localhost:8081/api/trpc/auth.createTestUser \
  -H "Content-Type: application/json" \
  -d '{"role": "super_admin"}'

# Te devolverá las credenciales:
# Email: test-super_admin-1234567890@example.com
# Password: password123
```

### Opción 3: Desde Prisma Studio

```bash
bunx prisma studio
```

1. Abre en el navegador: http://localhost:5555
2. Ve a la tabla "User"
3. Crea un usuario manualmente (la contraseña debe ser hasheada)

## 🧪 Probar el Sistema de Permisos

### 1. Crear Usuarios con Diferentes Roles

Usa la Opción 1 de arriba para crear:
- 1 Super Admin
- 1 Seller Admin
- 1 Collaborator
- 1 Viewer

Guarda las credenciales de cada uno.

### 2. Probar Permisos

**Super Admin / Seller Admin:**
- ✅ Puede crear eventos
- ✅ Puede editar cualquier evento
- ✅ Puede eliminar cualquier evento
- ✅ Puede gestionar asistentes
- ✅ Puede hacer check-in

**Collaborator:**
- ❌ NO puede crear eventos (el botón no aparece)
- ✅ Puede editar eventos existentes
- ❌ NO puede eliminar eventos
- ✅ Puede gestionar asistentes
- ✅ Puede hacer check-in

**Viewer:**
- ❌ NO puede crear eventos
- ❌ NO puede editar eventos
- ❌ NO puede eliminar eventos
- ❌ NO puede gestionar asistentes
- ✅ Solo puede ver reportes

### 3. Verificar que Funciona

1. Inicia sesión como **Viewer**
2. Intenta crear un evento → No debería poder
3. Cierra sesión
4. Inicia sesión como **Seller Admin**
5. Crea un evento → Debe funcionar
6. Cierra sesión
7. Inicia sesión como **Collaborator**
8. Intenta editar el evento → Debe funcionar
9. Intenta eliminar el evento → No debería poder

## 🔄 Verificar Sincronización

### Test 1: Entre Navegadores

1. Abre http://localhost:8081 en Chrome
2. Inicia sesión como Seller Admin
3. Crea un evento llamado "Test Chrome"
4. Abre http://localhost:8081 en Firefox (o modo incógnito de Chrome)
5. Inicia sesión con el mismo usuario
6. ✅ Deberías ver el evento "Test Chrome"

### Test 2: Entre Dispositivos

1. En tu computadora, crea un evento
2. En tu teléfono móvil:
   - Instala Expo Go (App Store o Google Play)
   - Escanea el QR que aparece en la terminal
   - Inicia sesión con el mismo usuario
   - ✅ Deberías ver el mismo evento

### Test 3: Ediciones en Tiempo Real

1. Abre la app en 2 dispositivos diferentes
2. En el dispositivo 1, edita un evento
3. En el dispositivo 2, actualiza la lista
4. ✅ Los cambios deben aparecer

## 🖼️ Probar Subida de Imágenes

### En Móvil (funciona perfectamente):

1. Al crear un evento, toca el campo de imagen
2. Selecciona "Tomar foto" o "Elegir de galería"
3. La imagen se optimiza automáticamente
4. ✅ La imagen se guarda y se muestra correctamente

### En Web (limitaciones del navegador):

1. Al crear un evento, toca el campo de imagen
2. Solo puedes "Elegir archivo"
3. La imagen se optimiza con las limitaciones de la web
4. ✅ Funciona pero con menos funcionalidad que en móvil

## 📱 Deployment en tu VPS de Hostinger

Sigue la guía completa en [DEPLOYMENT.md](./DEPLOYMENT.md)

### Resumen Rápido:

```bash
# 1. Conectar a tu VPS
ssh root@tu-ip-hostinger

# 2. Instalar requisitos
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql postgresql-contrib nginx
npm install -g pm2

# 3. Configurar PostgreSQL
sudo -u postgres psql
CREATE DATABASE eventos_app;
CREATE USER eventos_user WITH PASSWORD 'TuPasswordSeguro123';
GRANT ALL PRIVILEGES ON DATABASE eventos_app TO eventos_user;
\q

# 4. Subir tu código
mkdir -p /var/www/eventos-app
cd /var/www/eventos-app
# Sube tus archivos aquí (usando scp, sftp, o git)

# 5. Configurar .env
nano .env
# Pega tu configuración con la URL de BD correcta
# DATABASE_URL="postgresql://eventos_user:TuPasswordSeguro123@localhost:5432/eventos_app"

# 6. Instalar y preparar
bun install
bunx prisma generate
bunx prisma db push

# 7. Configurar Nginx
# Sigue la guía en DEPLOYMENT.md sección 4

# 8. Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 9. Configurar SSL (HTTPS)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tu-dominio.com
```

## 📊 Ver la Base de Datos

### Opción 1: Prisma Studio (Recomendado)

```bash
bunx prisma studio
```

Abre http://localhost:5555 y podrás:
- Ver todas las tablas
- Agregar/editar/eliminar registros
- Buscar y filtrar datos
- Hacer backups

### Opción 2: psql (Línea de comandos)

```bash
psql -U eventos_user -d eventos_app

# Comandos útiles:
\dt                    # Listar tablas
\d User                # Describir tabla User
SELECT * FROM "User";  # Ver todos los usuarios
\q                     # Salir
```

## 🐛 Solución de Problemas Comunes

### Error: "Can't reach database server"

**Causa**: PostgreSQL no está corriendo o la URL es incorrecta.

**Solución**:
```bash
# Verificar que PostgreSQL esté corriendo
brew services list  # macOS
systemctl status postgresql  # Linux

# Si no está corriendo, iniciarlo
brew services start postgresql@15  # macOS
sudo systemctl start postgresql  # Linux

# Verificar la URL en .env
cat .env | grep DATABASE_URL
```

### Error: "Invalid credentials"

**Causa**: Email o contraseña incorrectos.

**Solución**:
1. Verifica que el usuario exista: `bunx prisma studio`
2. Crea un nuevo usuario de prueba desde Admin > Test Users
3. Usa las credenciales exactas que te dio el sistema

### Error: "Unauthorized" al hacer peticiones

**Causa**: El token JWT expiró o es inválido.

**Solución**:
1. Cierra sesión
2. Vuelve a iniciar sesión
3. El sistema generará un nuevo token

### Los eventos no aparecen en otros dispositivos

**Causa**: No estás conectado al backend o usas cuentas diferentes.

**Solución**:
1. Verifica que ambos dispositivos usen el mismo usuario
2. Verifica que el backend esté corriendo: `http://localhost:8081/api`
3. Verifica `EXPO_PUBLIC_API_URL` en `.env`
4. Si usas dispositivo móvil, usa tu IP local: `http://192.168.1.X:8081/api`

### Error al subir imágenes

**Causa**: Permisos o espacio insuficiente.

**Solución**:
```bash
# Verificar espacio en disco
df -h

# Crear directorio de uploads
mkdir -p uploads
chmod 755 uploads

# Verificar configuración
cat .env | grep UPLOAD_DIR
```

### La base de datos está corrupta

**Solución**: Recrear desde cero
```bash
# CUIDADO: Esto borra todos los datos
bunx prisma db push --force-reset
bunx prisma generate
```

## 📚 Recursos Adicionales

### Documentación
- [SETUP.md](./SETUP.md) - Configuración detallada
- [README-DATABASE.md](./README-DATABASE.md) - Sistema de base de datos
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy en producción

### Videos Tutoriales Recomendados
- PostgreSQL para principiantes
- JWT Authentication explicado
- tRPC tutorial
- Prisma ORM tutorial

### Herramientas Útiles
- [Prisma Studio](https://www.prisma.io/studio) - Ver base de datos
- [Postman](https://www.postman.com/) - Probar APIs
- [TablePlus](https://tableplus.com/) - Cliente de PostgreSQL
- [DBeaver](https://dbeaver.io/) - Cliente de base de datos gratis

## ✅ Checklist Final

Antes de dar por terminado, verifica:

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos creada (`eventos_app`)
- [ ] Archivo `.env` configurado
- [ ] `bunx prisma generate` ejecutado sin errores
- [ ] `bunx prisma db push` ejecutado sin errores
- [ ] Servidor iniciado con `bun run start`
- [ ] Usuario de prueba creado
- [ ] Login funciona correctamente
- [ ] Puedes crear un evento
- [ ] El evento aparece en la lista
- [ ] Puedes editar el evento
- [ ] Los permisos funcionan correctamente
- [ ] Las imágenes se suben y optimizan
- [ ] La sincronización funciona entre dispositivos

## 🎉 ¡Listo!

Tu aplicación ahora es completamente funcional con:
- ✅ Base de datos real (PostgreSQL)
- ✅ Sincronización entre dispositivos
- ✅ Sistema de autenticación
- ✅ Permisos de usuario
- ✅ Subida de imágenes optimizada
- ✅ Documentación completa

## 📞 Soporte

Si tienes problemas:
1. Lee esta guía completa
2. Revisa [SETUP.md](./SETUP.md)
3. Revisa [README-DATABASE.md](./README-DATABASE.md)
4. Revisa los logs: `pm2 logs` o en la terminal
5. Busca el error en la documentación de Prisma/tRPC

---

**¡Éxito con tu proyecto!** 🚀
