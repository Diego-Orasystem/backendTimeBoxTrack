const express = require('express');
const { body } = require('express-validator');
const AdminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Middleware de autenticación para todas las rutas de admin
router.use(authenticateToken);
router.use(requireRole(['admin', 'Platform Administrator']));

// Validaciones para crear/actualizar usuarios
const userValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .trim(),
  
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres')
    .trim(),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Contraseña debe tener al menos 6 caracteres'),
  
  body('roleId')
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^role-\d+$|^[a-zA-Z0-9_-]+$/)
    .withMessage('ID de rol inválido'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano'),
  
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified debe ser un valor booleano')
];

// Validaciones para actualizar usuarios (password opcional)
const updateUserValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres')
    .trim(),
  
  body('password')
    .optional()
    .isLength({ min: 6, max: 100 })
    .withMessage('Contraseña debe tener al menos 6 caracteres'),
  
  body('roleId')
    .optional()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^role-\d+$|^[a-zA-Z0-9_-]+$/)
    .withMessage('ID de rol inválido'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano'),
  
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified debe ser un valor booleano')
];

// Rutas de gestión de usuarios
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUserById);
router.post('/users', userValidation, AdminController.createUser);
router.put('/users/:id', updateUserValidation, AdminController.updateUser);
router.patch('/users/:id/toggle-status', AdminController.toggleUserStatus);
router.delete('/users/:id', AdminController.deleteUser);

// Ruta para obtener roles disponibles
router.get('/roles', AdminController.getAvailableRoles);

module.exports = router;

