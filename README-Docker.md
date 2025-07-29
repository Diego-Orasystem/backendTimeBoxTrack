# Docker Setup - Timebox Tracking Backend

Este documento describe cómo configurar y ejecutar el backend de Timebox Tracking usando Docker.

## 📋 Prerrequisitos

- Docker Desktop instalado y ejecutándose
- Docker Compose (incluido en Docker Desktop)
- Make (opcional, para usar comandos simplificados)

## 🚀 Inicio Rápido

### Desarrollo
```bash
# Construir y levantar servicios de desarrollo
make build-dev
make up-dev

# O usando docker-compose directamente
docker-compose -f docker-compose.dev.yml up -d --build
```

### Producción
```bash
# Construir y levantar servicios de producción
make build
make up

# O usando docker-compose directamente
docker-compose up -d --build
```

## 📁 Estructura de Archivos

```
backend/
├── Dockerfile              # Imagen de producción
├── Dockerfile.dev          # Imagen de desarrollo
├── docker-compose.yml      # Orquestación de producción
├── docker-compose.dev.yml  # Orquestación de desarrollo
├── Makefile               # Comandos simplificados
├── .dockerignore          # Archivos excluidos del build
└── database/
    ├── schema.sql         # Esquema de base de datos
    └── seed.sql           # Datos iniciales
```

## 🔧 Configuración

### Variables de Entorno

#### Desarrollo
Las variables de entorno para desarrollo están definidas en `docker-compose.dev.yml`:

```yaml
environment:
  - NODE_ENV=development
  - DB_HOST=database
  - DB_USER=timebox_user
  - DB_PASSWORD=timebox_password
  - DB_NAME=timebox_tracking
```

#### Producción
Para producción, se recomienda usar un archivo `.env`:

```bash
# Crear archivo .env
cp env.example .env
```

Y modificar las variables según sea necesario.

### Base de Datos

La base de datos MariaDB se configura automáticamente con:
- **Base de datos**: `timebox_tracking`
- **Usuario**: `timebox_user`
- **Contraseña**: `timebox_password`
- **Puerto**: `3306`

Los archivos `schema.sql` y `seed.sql` se ejecutan automáticamente al iniciar el contenedor.

## 🛠️ Comandos Útiles

### Usando Make (Recomendado)

```bash
# Ver todos los comandos disponibles
make help

# Desarrollo
make build-dev    # Construir imagen de desarrollo
make up-dev       # Levantar servicios de desarrollo
make down-dev     # Detener servicios de desarrollo
make logs-dev     # Ver logs de desarrollo
make restart-dev  # Reiniciar servicios de desarrollo

# Producción
make build        # Construir imagen de producción
make up           # Levantar servicios de producción
make down         # Detener servicios de producción
make logs         # Ver logs de producción
make restart      # Reiniciar servicios de producción

# Utilidades
make status       # Ver estado de contenedores
make shell-backend-dev  # Acceder al shell del backend
make shell-db-dev       # Acceder a la base de datos
make backup-db-dev      # Hacer backup de la base de datos
```

### Usando Docker Compose Directamente

```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f

# Producción
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## 🔍 Monitoreo y Debugging

### Health Checks
- **Backend**: `http://localhost:3000/health`
- **Base de datos**: Verificado automáticamente por Docker

### Logs
```bash
# Ver logs en tiempo real
make logs-dev     # Desarrollo
make logs         # Producción

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f database
```

### Acceso a Contenedores
```bash
# Acceder al shell del backend
make shell-backend-dev

# Acceder a la base de datos
make shell-db-dev

# Ejecutar comandos específicos
docker exec -it timebox-backend-dev npm run test
```

## 🗄️ Gestión de Datos

### Backup y Restore

```bash
# Crear backup
make backup-db-dev

# Restaurar backup (manual)
docker exec -i timebox-db-dev mysql -u root -proot timebox_tracking < backup_file.sql
```

### Volúmenes
- **Base de datos**: `db_data_dev` (desarrollo) / `db_data` (producción)
- **Uploads**: `uploads_data_dev` (desarrollo) / `uploads_data` (producción)

Los volúmenes persisten entre reinicios de contenedores.

## 🔒 Seguridad

### Producción
- Usuario no-root en contenedores
- Variables de entorno seguras
- Health checks implementados
- Imágenes optimizadas

### Recomendaciones
1. Cambiar contraseñas por defecto
2. Usar secrets de Docker para credenciales
3. Configurar firewall
4. Usar HTTPS en producción

## 🚨 Troubleshooting

### Problemas Comunes

#### Contenedor no inicia
```bash
# Ver logs detallados
docker-compose logs backend

# Verificar configuración
docker-compose config
```

#### Base de datos no conecta
```bash
# Verificar estado de la base de datos
docker-compose ps database

# Ver logs de la base de datos
docker-compose logs database

# Probar conexión manual
make shell-db-dev
```

#### Puerto ocupado
```bash
# Ver qué usa el puerto
netstat -tulpn | grep :3000

# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Puerto externo:interno
```

### Limpieza
```bash
# Limpiar contenedores y volúmenes
make clean-dev    # Desarrollo
make clean        # Producción

# Limpieza completa
make clean-all
```

## 📊 Monitoreo de Recursos

```bash
# Ver uso de recursos
docker stats

# Ver información detallada
docker system df
```

## 🔄 CI/CD

### GitHub Actions (Ejemplo)
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker-compose build
      - name: Run tests
        run: docker-compose run --rm backend npm test
```

## 📞 Soporte

Para problemas específicos:
1. Revisar logs: `make logs-dev`
2. Verificar configuración: `docker-compose config`
3. Probar conectividad: `make shell-backend-dev`

---

**Nota**: Este setup está optimizado para desarrollo local. Para producción, considere usar un orquestador como Kubernetes o Docker Swarm.