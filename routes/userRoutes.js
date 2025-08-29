const express = require('express');
const { body, param, query } = require('express-validator');
const UserController = require('../controllers/userController');
const { 
  authenticateToken, 
  requireRole, 
  requirePermission, 
  requireOwnershipOrPermission,
  logActivity,
  getRealIP 
} = require('../middleware/auth');

const router = express.Router();

// =====================================================
// VALIDACIONES
// =====================================================

// Validaciones para login
const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Username o email es requerido')
    .isLength({ min: 3 })
    .withMessage('Username o email debe tener al menos 3 caracteres'),
  body('password')
    .notEmpty()
    .withMessage('Contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validaciones para crear usuario
const createUserValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username solo puede contener letras, números, guiones y guiones bajos'),
  body('email')
    .notEmpty()
    .withMessage('Email es requerido')
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial'),
  body('first_name')
    .notEmpty()
    .withMessage('Nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('last_name')
    .notEmpty()
    .withMessage('Apellido es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('Apellido debe tener entre 2 y 100 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Teléfono debe ser válido'),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('URL del avatar debe ser válida'),
  body('default_role_id')
    .optional()
    .isUUID()
    .withMessage('ID del rol debe ser un UUID válido')
];

// Validaciones para actualizar usuario
const updateUserValidation = [
  param('id')
    .isUUID()
    .withMessage('ID del usuario debe ser un UUID válido'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username solo puede contener letras, números, guiones y guiones bajos'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),
  body('first_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('last_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Apellido debe tener entre 2 y 100 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Teléfono debe ser válido'),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('URL del avatar debe ser válida'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Estado activo debe ser un valor booleano')
];

// Validaciones para actualizar perfil
const updateProfileValidation = [
  body('first_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('last_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Apellido debe tener entre 2 y 100 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Teléfono debe ser válido'),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('URL del avatar debe ser válida')
];

// Validaciones para cambiar contraseña
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Contraseña actual es requerida'),
  body('newPassword')
    .notEmpty()
    .withMessage('Nueva contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La nueva contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial')
];

// Validaciones para reseteo de contraseña
const passwordResetValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email es requerido')
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token es requerido'),
  body('newPassword')
    .notEmpty()
    .withMessage('Nueva contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La nueva contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial')
];

// Validaciones para asignar/remover roles
const roleValidation = [
  param('id')
    .isUUID()
    .withMessage('ID del usuario debe ser un UUID válido'),
  body('role_id')
    .notEmpty()
    .withMessage('ID del rol es requerido')
    .isUUID()
    .withMessage('ID del rol debe ser un UUID válido'),
  body('project_id')
    .optional()
    .isUUID()
    .withMessage('ID del proyecto debe ser un UUID válido'),
  body('timebox_id')
    .optional()
    .isUUID()
    .withMessage('ID del timebox debe ser un UUID válido'),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Fecha de expiración debe ser válida')
];

// =====================================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// =====================================================

/**
 * @route POST /auth/login
 * @desc Login de usuario
 * @access Public
 */
router.post('/auth/login', 
  getRealIP,
  loginValidation,
  logActivity('user_login', 'auth'),
  UserController.login
);

/**
 * @route POST /auth/refresh
 * @desc Refrescar token de acceso
 * @access Public
 */
router.post('/auth/refresh',
  getRealIP,
  body('refreshToken').notEmpty().withMessage('Token de refresh es requerido'),
  UserController.refreshToken
);

/**
 * @route POST /auth/forgot-password
 * @desc Solicitar reseteo de contraseña
 * @access Public
 */
router.post('/auth/forgot-password',
  getRealIP,
  passwordResetValidation,
  logActivity('password_reset_requested', 'auth'),
  UserController.requestPasswordReset
);

/**
 * @route POST /auth/reset-password
 * @desc Resetear contraseña con token
 * @access Public
 */
router.post('/auth/reset-password',
  getRealIP,
  resetPasswordValidation,
  logActivity('password_reset_completed', 'auth'),
  UserController.resetPassword
);

// Ruta de registro de usuarios
router.post('/auth/register', [
  body('username').isLength({ min: 3, max: 50 }).withMessage('Username debe tener entre 3 y 50 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('firstName').isLength({ min: 2, max: 50 }).withMessage('Nombre debe tener entre 2 y 50 caracteres'),
  body('lastName').isLength({ min: 2, max: 50 }).withMessage('Apellido debe tener entre 2 y 50 caracteres'),
  body('password').isLength({ min: 6, max: 100 }).withMessage('Contraseña debe tener al menos 6 caracteres')
], UserController.register);

// =====================================================
// RUTAS PROTEGIDAS (CON AUTENTICACIÓN)
// =====================================================

/**
 * @route POST /auth/logout
 * @desc Logout de usuario
 * @access Private
 */
router.post('/auth/logout',
  authenticateToken,
  getRealIP,
  logActivity('user_logout', 'auth'),
  UserController.logout
);

/**
 * @route POST /auth/logout-no-auth
 * @desc Logout de usuario sin requerir token válido
 * @access Public
 */
router.post('/auth/logout-no-auth',
  getRealIP,
  UserController.logoutNoAuth
);

/**
 * @route GET /auth/verify
 * @desc Verificar token de acceso
 * @access Private
 */
router.get('/auth/verify',
  authenticateToken,
  UserController.verifyToken
);

/**
 * @route GET /profile
 * @desc Obtener perfil del usuario autenticado
 * @access Private
 */
router.get('/profile',
  authenticateToken,
  UserController.getProfile
);

/**
 * @route PUT /profile
 * @desc Actualizar perfil del usuario autenticado
 * @access Private
 */
router.put('/profile',
  authenticateToken,
  updateProfileValidation,
  logActivity('profile_updated', 'user'),
  UserController.updateProfile
);

/**
 * @route PUT /profile/change-password
 * @desc Cambiar contraseña del usuario autenticado
 * @access Private
 */
router.put('/profile/change-password',
  authenticateToken,
  changePasswordValidation,
  logActivity('password_changed', 'user'),
  UserController.changePassword
);

// =====================================================
// RUTAS DE ADMINISTRACIÓN (REQUIEREN PERMISOS ESPECIALES)
// =====================================================

/**
 * @route POST /users
 * @desc Crear nuevo usuario
 * @access Private - Requiere permiso user:write
 */
router.post('/users',
  authenticateToken,
  requirePermission('user', 'write'),
  createUserValidation,
  logActivity('user_created', 'user'),
  UserController.createUser
);

/**
 * @route GET /users
 * @desc Obtener todos los usuarios
 * @access Private - Requiere permiso user:read
 */
router.get('/users',
  authenticateToken,
  requirePermission('user', 'read'),
  query('is_active').optional().isBoolean().withMessage('is_active debe ser un valor booleano'),
  query('role').optional().isString().withMessage('role debe ser una cadena'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un número entre 1 y 100'),
  UserController.getAllUsers
);

/**
 * @route GET /users/:id
 * @desc Obtener usuario por ID
 * @access Private - Requiere permiso user:read o ser propietario
 */
router.get('/users/:id',
  authenticateToken,
  requireOwnershipOrPermission('user', 'read'),
  param('id').isUUID().withMessage('ID del usuario debe ser un UUID válido'),
  UserController.getUserById
);

/**
 * @route PUT /users/:id
 * @desc Actualizar usuario
 * @access Private - Requiere permiso user:write o ser propietario
 */
router.put('/users/:id',
  authenticateToken,
  requireOwnershipOrPermission('user', 'write'),
  updateUserValidation,
  logActivity('user_updated', 'user'),
  UserController.updateUser
);

/**
 * @route DELETE /users/:id
 * @desc Eliminar usuario (soft delete)
 * @access Private - Requiere permiso user:delete
 */
router.delete('/users/:id',
  authenticateToken,
  requirePermission('user', 'delete'),
  param('id').isUUID().withMessage('ID del usuario debe ser un UUID válido'),
  logActivity('user_deleted', 'user'),
  UserController.deleteUser
);

// =====================================================
// RUTAS DE GESTIÓN DE ROLES
// =====================================================

/**
 * @route GET /users/:id/roles
 * @desc Obtener roles de un usuario
 * @access Private - Requiere permiso user:read o ser propietario
 */
router.get('/users/:id/roles',
  authenticateToken,
  requireOwnershipOrPermission('user', 'read'),
  param('id').isUUID().withMessage('ID del usuario debe ser un UUID válido'),
  query('project_id').optional().isUUID().withMessage('project_id debe ser un UUID válido'),
  query('timebox_id').optional().isUUID().withMessage('timebox_id debe ser un UUID válido'),
  UserController.getUserRoles
);

/**
 * @route POST /users/:id/roles
 * @desc Asignar rol a usuario
 * @access Private - Requiere permiso user:write
 */
router.post('/users/:id/roles',
  authenticateToken,
  requirePermission('user', 'write'),
  roleValidation,
  logActivity('role_assigned', 'user'),
  UserController.assignRole
);

/**
 * @route DELETE /users/:id/roles
 * @desc Remover rol de usuario
 * @access Private - Requiere permiso user:write
 */
router.delete('/users/:id/roles',
  authenticateToken,
  requirePermission('user', 'write'),
  roleValidation,
  logActivity('role_removed', 'user'),
  UserController.removeRole
);

// =====================================================
// RUTAS DE ESTADÍSTICAS Y REPORTES
// =====================================================

/**
 * @route GET /users/stats
 * @desc Obtener estadísticas de usuarios
 * @access Private - Requiere permiso user:read
 */
router.get('/users/stats',
  authenticateToken,
  requirePermission('user', 'read'),
  UserController.getUserStats
);

/**
 * @route GET /users/role/:role
 * @desc Buscar usuarios por rol
 * @access Private - Requiere permiso user:read
 */
router.get('/users/role/:role',
  authenticateToken,
  requirePermission('user', 'read'),
  param('role').isString().withMessage('Rol debe ser una cadena'),
  query('project_id').optional().isUUID().withMessage('project_id debe ser un UUID válido'),
  query('timebox_id').optional().isUUID().withMessage('timebox_id debe ser un UUID válido'),
  UserController.findUsersByRole
);

// =====================================================
// RUTAS DE ROLES Y PERMISOS
// =====================================================

/**
 * @route GET /roles
 * @desc Obtener todos los roles disponibles
 * @access Private - Requiere permiso user:read
 */
router.get('/roles',
  authenticateToken,
  requirePermission('user', 'read'),
  async (req, res) => {
    try {
      const { executeQuery } = require('../config/database');
      const roles = await executeQuery(`
        SELECT id, name, description, level, is_active, created_at, updated_at
        FROM roles 
        WHERE is_active = TRUE 
        ORDER BY level DESC, name ASC
      `);

      res.json({
        success: true,
        count: roles.length,
        data: roles
      });
    } catch (error) {
      console.error('Error al obtener roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

/**
 * @route GET /permissions
 * @desc Obtener todos los permisos disponibles
 * @access Private - Requiere permiso user:read
 */
router.get('/permissions',
  authenticateToken,
  requirePermission('user', 'read'),
  async (req, res) => {
    try {
      const { executeQuery } = require('../config/database');
      const permissions = await executeQuery(`
        SELECT id, name, description, resource, action, is_active, created_at, updated_at
        FROM permissions 
        WHERE is_active = TRUE 
        ORDER BY resource, action
      `);

      res.json({
        success: true,
        count: permissions.length,
        data: permissions
      });
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Middleware para manejar rutas no encontradas
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = router;
