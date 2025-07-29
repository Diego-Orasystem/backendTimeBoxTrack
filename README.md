# Backend Timebox Tracking

Backend desarrollado con Express.js y MariaDB para la aplicación de Timebox Tracking.

## 🚀 Características

- **Express.js**: Framework web para Node.js
- **MariaDB**: Base de datos relacional
- **Validación**: Express-validator para validación de datos
- **Seguridad**: Helmet para headers de seguridad
- **CORS**: Configuración para comunicación con frontend
- **Logging**: Morgan para logs de requests
- **Compresión**: Gzip para optimización de respuestas
- **Manejo de errores**: Middleware personalizado para errores

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- MariaDB (versión 10.5 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd timebox-track-main/backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Editar el archivo `.env` con tus configuraciones:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=timebox_user
   DB_PASSWORD=your_password
   DB_NAME=timebox_tracking
   DB_CONNECTION_LIMIT=10
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760
   CORS_ORIGIN=http://localhost:4200
   ```

4. **Configurar base de datos**
   ```bash
   # Conectar a MariaDB
   mysql -u root -p
   
   # Crear base de datos y usuario
   CREATE DATABASE timebox_tracking;
   CREATE USER 'timebox_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON timebox_tracking.* TO 'timebox_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   
   # Ejecutar esquema de base de datos
   mysql -u timebox_user -p timebox_tracking < database/schema.sql
   ```

5. **Crear carpeta de uploads**
   ```bash
   mkdir uploads
   ```

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📚 Estructura del Proyecto

```
backend/
├── config/
│   └── database.js          # Configuración de MariaDB
├── controllers/
│   ├── timeboxController.js # Controlador de timeboxes
│   └── projectController.js # Controlador de proyectos
├── database/
│   └── schema.sql           # Esquema de base de datos
├── middleware/
│   └── errorHandler.js      # Manejo de errores
├── models/
│   ├── Timebox.js           # Modelo de timebox
│   ├── Project.js           # Modelo de proyecto
│   └── Persona.js           # Modelo de persona
├── routes/
│   ├── timeboxRoutes.js     # Rutas de timeboxes
│   └── projectRoutes.js     # Rutas de proyectos
├── uploads/                 # Archivos subidos
├── .env                     # Variables de entorno
├── env.example              # Ejemplo de variables de entorno
├── package.json             # Dependencias y scripts
├── server.js                # Archivo principal del servidor
└── README.md                # Documentación
```

## 🔌 API Endpoints

### Timeboxes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/timeboxes` | Obtener todos los timeboxes |
| GET | `/api/timeboxes/stats` | Obtener estadísticas |
| GET | `/api/timeboxes/:id` | Obtener timebox por ID |
| GET | `/api/timeboxes/:id/fases` | Obtener timebox con fases |
| GET | `/api/timeboxes/project/:projectId` | Obtener timeboxes por proyecto |
| POST | `/api/timeboxes` | Crear nuevo timebox |
| PUT | `/api/timeboxes/:id` | Actualizar timebox |
| PATCH | `/api/timeboxes/:id/estado` | Actualizar estado del timebox |
| DELETE | `/api/timeboxes/:id` | Eliminar timebox |

### Proyectos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects` | Obtener todos los proyectos |
| GET | `/api/projects/stats` | Obtener estadísticas |
| GET | `/api/projects/:id` | Obtener proyecto por ID |
| GET | `/api/projects/:id/content` | Obtener proyecto con contenido |
| POST | `/api/projects` | Crear nuevo proyecto |
| PUT | `/api/projects/:id` | Actualizar proyecto |
| DELETE | `/api/projects/:id` | Eliminar proyecto |
| POST | `/api/projects/:projectId/content` | Agregar contenido al proyecto |
| PUT | `/api/projects/content/:contentId` | Actualizar contenido del proyecto |
| DELETE | `/api/projects/content/:contentId` | Eliminar contenido del proyecto |

### Utilidades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health check del servidor |
| GET | `/api` | Información de la API |

## 📊 Modelos de Datos

### Timebox
```javascript
{
  id: string,
  tipoTimeboxId: string,
  businessAnalystId: string,
  projectId: string,
  monto: number,
  estado: 'En Definición' | 'Disponible' | 'En Ejecución' | 'Finalizado',
  created_at: timestamp,
  updated_at: timestamp
}
```

### Project
```javascript
{
  id: string,
  nombre: string,
  descripcion: string,
  fecha_creacion: timestamp,
  timebox_count: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Persona
```javascript
{
  id: string,
  nombre: string,
  rol: string,
  email: string,
  habilidades: string[],
  created_at: timestamp,
  updated_at: timestamp
}
```

## 🔒 Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configuración de origen permitido
- **Validación**: Validación de datos de entrada
- **Sanitización**: Limpieza de datos de entrada
- **Rate Limiting**: Límite de requests (configurable)

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Cobertura de tests
npm run test:coverage
```

## 📝 Logs

Los logs se generan automáticamente con Morgan:
- **Combined**: Formato completo de logs
- **Nivel**: Info, Warning, Error
- **Archivo**: logs/app.log (configurable)

## 🚀 Despliegue

### Docker
```bash
# Construir imagen
docker build -t timebox-backend .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env timebox-backend
```

### PM2
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
pm2 start server.js --name "timebox-backend"

# Monitorear
pm2 monit
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| PORT | Puerto del servidor | 3000 |
| NODE_ENV | Ambiente | development |
| DB_HOST | Host de MariaDB | localhost |
| DB_PORT | Puerto de MariaDB | 3306 |
| DB_USER | Usuario de MariaDB | timebox_user |
| DB_PASSWORD | Contraseña de MariaDB | - |
| DB_NAME | Nombre de la base de datos | timebox_tracking |
| DB_CONNECTION_LIMIT | Límite de conexiones | 10 |
| JWT_SECRET | Clave secreta JWT | - |
| JWT_EXPIRES_IN | Expiración JWT | 24h |
| UPLOAD_PATH | Ruta de archivos | ./uploads |
| MAX_FILE_SIZE | Tamaño máximo de archivo | 10485760 |
| CORS_ORIGIN | Origen permitido CORS | http://localhost:4200 |

## 🐛 Troubleshooting

### Error de conexión a base de datos
1. Verificar que MariaDB esté ejecutándose
2. Verificar credenciales en `.env`
3. Verificar que la base de datos exista

### Error de CORS
1. Verificar configuración de `CORS_ORIGIN`
2. Verificar que el frontend esté en el origen permitido

### Error de permisos de archivos
1. Verificar permisos de la carpeta `uploads`
2. Verificar permisos de escritura

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. 