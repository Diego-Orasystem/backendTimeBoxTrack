# 🚀 Guía para Configurar PlanetScale

## Paso 1: Crear Cuenta en PlanetScale

1. Ve a [https://planetscale.com/](https://planetscale.com/)
2. Haz clic en "Start for free"
3. Regístrate con tu cuenta de GitHub o email
4. Confirma tu email

## Paso 2: Crear Proyecto

1. Una vez dentro del dashboard, haz clic en "New project"
2. Dale un nombre a tu proyecto (ej: "timebox-tracking")
3. Selecciona la región más cercana a ti
4. Haz clic en "Create project"

## Paso 3: Crear Base de Datos

1. En tu proyecto, haz clic en "New database"
2. Dale un nombre (ej: "timebox_tracking")
3. Selecciona "MySQL" como tipo
4. Haz clic en "Create database"

## Paso 4: Obtener Credenciales

1. En tu base de datos, ve a la pestaña "Connect"
2. Selecciona "Connect with MySQL"
3. Copia las credenciales que aparecen:

```bash
Host: aws.connect.psdb.cloud
Port: 3306
Database: timebox_tracking
Username: tu_usuario
Password: tu_password
```

## Paso 5: Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
```bash
cp env-planetscale.example .env
```

2. Edita el archivo `.env` con tus credenciales:
```env
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_USER=tu_usuario_planetscale
DB_PASSWORD=tu_password_planetscale
DB_NAME=timebox_tracking
```

## Paso 6: Ejecutar Esquema de Base de Datos

### Opción A: Usando PlanetScale CLI (Recomendado)

1. Instalar PlanetScale CLI:
```bash
npm install -g pscale
```

2. Autenticarte:
```bash
pscale auth login
```

3. Ejecutar el esquema:
```bash
pscale db shell timebox_tracking --execute-file database/schema.sql
```

### Opción B: Usando MySQL Client

1. Conectar a la base de datos:
```bash
mysql -h aws.connect.psdb.cloud -P 3306 -u tu_usuario -p timebox_tracking
```

2. Ejecutar el esquema:
```bash
source database/schema.sql;
```

## Paso 7: Poblar con Datos de Ejemplo

```bash
npm run seed
```

## Paso 8: Probar Conexión

```bash
npm run dev
```

Deberías ver: `✅ Conexión a PlanetScale establecida correctamente`

## 🔧 Configuración Adicional

### Variables de Entorno Completas

```env
# Configuración del servidor
PORT=3000
NODE_ENV=production

# Configuración de PlanetScale
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_USER=tu_usuario_planetscale
DB_PASSWORD=tu_password_planetscale
DB_NAME=timebox_tracking
DB_CONNECTION_LIMIT=10

# Configuración JWT
JWT_SECRET=tu_jwt_secret_key_aqui
JWT_EXPIRES_IN=24h

# Configuración de archivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Configuración CORS
CORS_ORIGIN=https://tu-frontend.com
```

### Límites del Plan Gratuito

- **1 base de datos**
- **1GB de almacenamiento**
- **1B de filas**
- **1M de filas leídas/mes**
- **10M de filas escritas/mes**

### Monitoreo

En el dashboard de PlanetScale puedes:
- Ver estadísticas de uso
- Monitorear consultas
- Ver logs de conexión
- Configurar backups

## 🚨 Solución de Problemas

### Error de SSL
Si tienes problemas con SSL, modifica la configuración en `config/database-planetscale.js`:

```javascript
ssl: {
  rejectUnauthorized: false
}
```

### Error de Conexión
1. Verifica que las credenciales sean correctas
2. Asegúrate de que la base de datos esté activa
3. Verifica que no hayas excedido los límites del plan gratuito

### Error de Esquema
1. Verifica que el esquema sea compatible con MySQL
2. Algunas funciones específicas de MariaDB pueden no funcionar
3. Usa la versión MySQL del esquema si es necesario

## 📞 Soporte

- **Documentación**: [https://planetscale.com/docs](https://planetscale.com/docs)
- **Discord**: [https://discord.gg/planetscale](https://discord.gg/planetscale)
- **Email**: support@planetscale.com 