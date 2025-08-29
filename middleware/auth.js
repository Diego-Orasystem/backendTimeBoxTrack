const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de autenticación JWT
 * Verifica que el token sea válido y extrae la información del usuario
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expirado',
            code: 'TOKEN_EXPIRED'
          });
        }
        return res.status(403).json({
          success: false,
          message: 'Token inválido'
        });
      }

      // Obtener usuario actualizado de la base de datos
      const user = await User.findById(decoded.id);
      if (!user || !user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no encontrado o inactivo'
        });
      }

      // Agregar información del usuario al request
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: user.roles || [],
        role_ids: user.role_ids || []
      };

      next();
    });
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para verificar si el usuario tiene un rol específico
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userRoles = req.user.roles;
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    // Extraer nombres de roles del usuario (pueden ser strings o objetos)
    const userRoleNames = userRoles.map(role => 
      typeof role === 'string' ? role : role.name
    );

    const hasRequiredRole = rolesArray.some(requiredRole => 
      userRoleNames.includes(requiredRole)
    );
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        required: rolesArray,
        current: userRoleNames
      });
    }

    next();
  };
};

/**
 * Middleware para verificar si el usuario tiene un nivel de rol específico o superior
 */
const requireRoleLevel = (requiredLevel) => {
  const levelHierarchy = {
    'PLATFORM': 4,
    'PROJECT': 3,
    'TEAM': 2,
    'SUPPORT': 1
  };

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    try {
      const userRoles = await User.getUserRoles(req.user.id);
      const hasRequiredLevel = userRoles.some(role => {
        const roleLevel = levelHierarchy[role.level] || 0;
        return roleLevel >= levelHierarchy[requiredLevel];
      });

      if (!hasRequiredLevel) {
        return res.status(403).json({
          success: false,
          message: `Se requiere nivel de rol ${requiredLevel} o superior`,
          required: requiredLevel,
          current: userRoles.map(r => r.level)
        });
      }

      next();
    } catch (error) {
      console.error('Error al verificar nivel de rol:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Middleware para verificar permisos específicos
 */
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    try {
      // Obtener opciones del contexto (project_id, timebox_id)
      const options = {};
      if (req.params.projectId) options.project_id = req.params.projectId;
      if (req.params.timeboxId) options.timebox_id = req.params.timeboxId;
      if (req.body.project_id) options.project_id = req.body.project_id;
      if (req.body.timebox_id) options.timebox_id = req.body.timebox_id;

      const hasPermission = await User.hasPermission(req.user.id, resource, action, options);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `No tienes permiso para ${action} en ${resource}`,
          required: { resource, action },
          context: options
        });
      }

      next();
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario es propietario del recurso o tiene permisos administrativos
 */
const requireOwnershipOrPermission = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    try {
      // Verificar si el usuario es propietario del recurso
      const resourceId = req.params.id || req.params.userId || req.body.user_id;
      const isOwner = resourceId === req.user.id;

      if (isOwner) {
        return next(); // El propietario siempre puede acceder
      }

      // Si no es propietario, verificar permisos
      const options = {};
      if (req.params.projectId) options.project_id = req.params.projectId;
      if (req.params.timeboxId) options.timebox_id = req.params.timebox_id;

      const hasPermission = await User.hasPermission(req.user.id, resource, action, options);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `No tienes permiso para ${action} en ${resource}`,
          required: { resource, action },
          context: options
        });
      }

      next();
    } catch (error) {
      console.error('Error al verificar propiedad o permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario está activo
 */
const requireActiveUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  // El middleware de autenticación ya verifica que el usuario esté activo
  // pero podemos agregar verificaciones adicionales aquí si es necesario
  next();
};

// Middleware de verificación de usuario removido - todos los usuarios activos pueden acceder

/**
 * Middleware para logging de actividad
 */
const logActivity = (action, resourceType = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log de actividad después de que se complete la respuesta
      if (req.user && res.statusCode < 400) {
        try {
          const activityData = {
            user_id: req.user.id,
            action: action,
            resource_type: resourceType,
            resource_id: req.params.id || req.params.userId || null,
            details: {
              method: req.method,
              path: req.path,
              ip: req.ip || req.connection.remoteAddress,
              user_agent: req.get('User-Agent')
            },
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent')
          };

          // Ejecutar en background para no bloquear la respuesta
          setImmediate(async () => {
            try {
              const { executeQuery } = require('../config/database');
              await executeQuery(`
                INSERT INTO user_activities (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent)
                VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
              `, [
                activityData.user_id,
                activityData.action,
                activityData.resource_type,
                activityData.resource_id,
                JSON.stringify(activityData.details),
                activityData.ip_address,
                activityData.user_agent
              ]);
            } catch (logError) {
              console.error('Error al loguear actividad:', logError);
            }
          });
        } catch (error) {
          console.error('Error al preparar log de actividad:', error);
        }
      }
      
      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Middleware para obtener IP real del usuario
 */
const getRealIP = (req, res, next) => {
  req.realIP = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               req.connection.socket?.remoteAddress || 
               '127.0.0.1';
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireRoleLevel,
  requirePermission,
  requireOwnershipOrPermission,
  requireActiveUser,
  logActivity,
  getRealIP
};
