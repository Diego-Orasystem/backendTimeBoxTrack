// Middleware para manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación de base de datos
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      status: false,
      message: 'Datos duplicados',
      error: 'El registro ya existe en la base de datos'
    });
  }

  // Error de clave foránea
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      status: false,
      message: 'Referencia inválida',
      error: 'El registro referenciado no existe'
    });
  }

  // Error de conexión a base de datos
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      status: false,
      message: 'Error de conexión a la base de datos',
      error: 'No se pudo conectar con la base de datos'
    });
  }

  // Error de timeout
  if (err.code === 'ETIMEDOUT') {
    return res.status(408).json({
      status: false,
      message: 'Timeout de la operación',
      error: 'La operación tardó demasiado en completarse'
    });
  }

  // Error de sintaxis SQL
  if (err.code === 'ER_PARSE_ERROR') {
    return res.status(500).json({
      status: false,
      message: 'Error interno del servidor',
      error: 'Error en la consulta de base de datos'
    });
  }

  // Error de archivo no encontrado
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      status: false,
      message: 'Archivo no encontrado',
      error: 'El archivo solicitado no existe'
    });
  }

  // Error de permisos de archivo
  if (err.code === 'EACCES') {
    return res.status(403).json({
      status: false,
      message: 'Permisos insuficientes',
      error: 'No tiene permisos para acceder al recurso'
    });
  }

  // Error de validación de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: false,
      message: 'Token inválido',
      error: 'El token de autenticación es inválido'
    });
  }

  // Error de token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: false,
      message: 'Token expirado',
      error: 'El token de autenticación ha expirado'
    });
  }

  // Error de límite de archivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      status: false,
      message: 'Archivo demasiado grande',
      error: 'El tamaño del archivo excede el límite permitido'
    });
  }

  // Error de tipo de archivo no permitido
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      status: false,
      message: 'Tipo de archivo no permitido',
      error: 'El tipo de archivo no está permitido'
    });
  }

  // Error genérico
  res.status(500).json({
    status: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error inesperado'
  });
};

module.exports = errorHandler; 