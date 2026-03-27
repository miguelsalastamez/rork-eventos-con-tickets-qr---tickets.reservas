# Guía de Deployment en VPS (Hostinger)

## Requisitos Previos

- VPS con Ubuntu 20.04 o superior
- Acceso SSH al servidor
- Dominio configurado (opcional, pero recomendado)

## 1. Preparar el Servidor

### Conectar al VPS por SSH
```bash
ssh root@tu-ip-del-vps
```

### Actualizar el sistema
```bash
apt update && apt upgrade -y
```

### Instalar Node.js 20+
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### Instalar Bun (gestor de paquetes)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### Instalar PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
```

### Instalar Nginx (servidor web)
```bash
apt install -y nginx
```

### Instalar PM2 (gestor de procesos)
```bash
npm install -g pm2
```

## 2. Configurar PostgreSQL

### Acceder a PostgreSQL
```bash
sudo -u postgres psql
```

### Crear base de datos y usuario
```sql
CREATE DATABASE eventos_app;
CREATE USER eventos_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE eventos_app TO eventos_user;
\q
```

## 3. Clonar y Configurar la Aplicación

### Crear directorio para la app
```bash
mkdir -p /var/www/eventos-app
cd /var/www/eventos-app
```

### Subir archivos al servidor
Puedes usar `scp`, `rsync`, o Git:

#### Opción A: Usando SCP desde tu computadora local
```bash
scp -r /ruta/a/tu/proyecto/* root@tu-ip:/var/www/eventos-app/
```

#### Opción B: Usando Git
```bash
# En el servidor
cd /var/www/eventos-app
git clone https://tu-repositorio.git .
```

### Instalar dependencias
```bash
cd /var/www/eventos-app
bun install
```

### Configurar variables de entorno
```bash
nano .env
```

Añade el siguiente contenido (ajusta los valores):
```env
DATABASE_URL="postgresql://eventos_user:tu_password_seguro@localhost:5432/eventos_app?schema=public"
JWT_SECRET="$(openssl rand -base64 32)"
EXPO_PUBLIC_API_URL="https://tu-dominio.com/api"
EXPO_PUBLIC_TOOLKIT_URL="https://toolkit.rork.com"
PORT=8081
NODE_ENV=production
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`.

### Ejecutar migraciones de Prisma
```bash
bunx prisma generate
bunx prisma db push
```

## 4. Configurar Nginx

### Crear configuración para el sitio
```bash
nano /etc/nginx/sites-available/eventos-app
```

Añade el siguiente contenido (reemplaza `tu-dominio.com` con tu dominio):
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Activar el sitio
```bash
ln -s /etc/nginx/sites-available/eventos-app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 5. Instalar SSL con Let's Encrypt (HTTPS)

### Instalar Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### Obtener certificado SSL
```bash
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Sigue las instrucciones en pantalla. Certbot configurará automáticamente HTTPS.

## 6. Iniciar la Aplicación con PM2

### Crear archivo de configuración PM2
```bash
nano ecosystem.config.js
```

Añade el siguiente contenido:
```javascript
module.exports = {
  apps: [{
    name: 'eventos-app',
    script: 'bun',
    args: 'run start',
    cwd: '/var/www/eventos-app',
    env: {
      NODE_ENV: 'production',
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
```

### Iniciar la aplicación
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Ver logs
```bash
pm2 logs eventos-app
```

### Ver estado
```bash
pm2 status
```

## 7. Configurar Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## 8. Mantenimiento

### Actualizar la aplicación
```bash
cd /var/www/eventos-app
git pull  # Si usas Git
bun install
bunx prisma generate
bunx prisma db push
pm2 restart eventos-app
```

### Ver logs de la aplicación
```bash
pm2 logs eventos-app
```

### Reiniciar la aplicación
```bash
pm2 restart eventos-app
```

### Backup de la base de datos
```bash
pg_dump -U eventos_user eventos_app > backup-$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
psql -U eventos_user eventos_app < backup-YYYYMMDD.sql
```

## 9. Seguridad Adicional

### Cambiar puerto SSH (opcional)
```bash
nano /etc/ssh/sshd_config
# Cambia Port 22 a otro puerto (ej: Port 2222)
systemctl restart sshd
```

### Deshabilitar login root por SSH
```bash
nano /etc/ssh/sshd_config
# Cambia PermitRootLogin yes a PermitRootLogin no
systemctl restart sshd
```

### Configurar fail2ban
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

## Solución de Problemas

### La aplicación no inicia
```bash
pm2 logs eventos-app
# Revisa los logs para ver errores
```

### Error de conexión a la base de datos
```bash
# Verifica que PostgreSQL esté corriendo
systemctl status postgresql

# Verifica las credenciales en .env
nano .env
```

### Nginx no funciona
```bash
nginx -t  # Verificar configuración
systemctl status nginx  # Ver estado
tail -f /var/log/nginx/error.log  # Ver errores
```

## Recursos Adicionales

- Documentación de Prisma: https://www.prisma.io/docs
- Documentación de PM2: https://pm2.keymetrics.io/docs
- Documentación de Nginx: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
