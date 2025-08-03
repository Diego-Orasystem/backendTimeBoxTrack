# Scripts de Base de Datos - Timebox Track

Este directorio contiene scripts útiles para gestionar datos de prueba y verificar la conexión a la base de datos.

## 📋 Scripts Disponibles

### 1. 🔧 Test de Conexión
```bash
node backend/scripts/test-connection.js
```
**Qué hace:**
- Verifica la conexión a la base de datos
- Muestra información del servidor MySQL/MariaDB
- Lista las tablas existentes y su conteo de registros
- Útil para diagnosticar problemas de conexión

### 2. ⚡ Inserción Rápida
```bash
node backend/scripts/quick-insert.js
```
**Qué hace:**
- Inserta datos básicos de personas y categorías de timebox
- Proceso rápido (6 personas + 5 categorías de timebox)
- Ideal para pruebas rápidas

### 3. 📊 Inserción Completa
```bash
node backend/scripts/insert-test-data.js
```
**Qué hace:**
- Inserta un conjunto completo de datos de prueba
- 8 personas con roles variados y habilidades detalladas
- 5 categorías de timebox estándar
- Incluye resumen detallado al final
- Maneja duplicados automáticamente

### 4. 🎯 Tipos de Timebox
```bash
node backend/scripts/insert-timebox-types.js
```
**Qué hace:**
- Inserta tipos de timebox básicos (6 tipos estándar)
- Los vincula automáticamente con las categorías existentes
- Incluye entregables y evidencias de cierre
- **Requisito:** Ejecutar después de insertar categorías

## 🚀 Uso Recomendado

### Primer uso:
1. **Verificar conexión:**
   ```bash
   node backend/scripts/test-connection.js
   ```

2. **Insertar datos de prueba:**
   ```bash
   node backend/scripts/insert-test-data.js
   ```

3. **Insertar tipos de timebox:**
   ```bash
   node backend/scripts/insert-timebox-types.js
   ```

### Para desarrollo diario:
```bash
# Inserción rápida cuando necesites datos básicos
node backend/scripts/quick-insert.js
```

## 📁 Datos que se Insertan

### 👥 Personas de Prueba:
- **Team Leaders:** Carlos Rodriguez, Laura Sánchez
- **Business Analysts:** María González, Roberto García  
- **Developers:** Juan Pérez, Pedro Martínez
- **Testers:** Ana López, Carmen Ruiz

### 📂 Categorías de Timebox de Prueba:
- Investigación
- Construcción  
- Evolución
- Experimentación
- Integración

### 🎯 Tipos de Timebox de Prueba:
- **Investigación:** Análisis de Requisitos, Prototipo de UI/UX
- **Construcción:** Desarrollo Backend API, Desarrollo Frontend, Testing y QA
- **Evolución:** Mejora de Performance

## ⚙️ Configuración

Asegúrate de tener configurado tu archivo `.env` con:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=timebox_track
```

## 🔍 Solución de Problemas

### Error de conexión:
1. Verifica que MySQL/MariaDB esté ejecutándose
2. Confirma las credenciales en `.env`
3. Asegúrate que la base de datos existe

### Error "Tabla no existe":
1. Ejecuta el script de esquema: `backend/database/schema.sql`
2. O importa el esquema completo a tu base de datos

### Datos duplicados:
Los scripts manejan duplicados automáticamente usando `ON DUPLICATE KEY UPDATE`.

## 📞 APIs Resultantes

Después de ejecutar los scripts, tendrás disponibles:

- `GET /api/personas` - Lista todas las personas
- `GET /api/personas/rol/Team%20Leader` - Personas por rol
- `GET /api/timebox-categories` - Lista todas las categorías de timebox (pendiente de implementar)

¡Los datos estarán listos para usar en tu frontend!