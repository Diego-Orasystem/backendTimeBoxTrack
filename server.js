const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

// Importar rutas
const timeboxRoutes = require('./routes/timeboxRoutes');
const projectRoutes = require('./routes/projectRoutes');
const timeboxMaintainerRoutes = require('./routes/timeboxMaintainerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const personaRoutes = require('./routes/personaRoutes');

// Importar middleware de manejo de errores
const errorHandler = require('./middleware/errorHandler');

// Crear aplicación Express
const app = express();

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());

// Middleware de compresión
app.use(compression());

// Middleware de logging
app.use(morgan('combined'));

// Middleware de CORS
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://10.90.0.190:4000',
    'http://10.90.0.190',
    'http://localhost:3000',
    'http://10.90.0.190:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'Origin', 'Accept']
}));

// Middleware para parsear JSON
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Middleware para servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta de información de la API
app.get('/api', (req, res) => {
  res.json({
    status: true,
    message: 'API de Timebox Tracking',
    version: '1.0.0',
    endpoints: {
      timeboxes: '/api/timeboxes',
      project: '/api/project',
      personas: '/api/personas',
      upload: '/api/upload',
      health: '/health'
    },
    documentation: 'Documentación disponible en /api/docs'
  });
});

// Rutas de la API
app.use('/api/timeboxes', timeboxRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/timebox/maintainer', timeboxMaintainerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/personas', personaRoutes);

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    status: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función para iniciar el servidor
async function startServer() {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. Verifique la configuración.');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Señal SIGTERM recibida. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Señal SIGINT recibida. Cerrando servidor...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer(); 