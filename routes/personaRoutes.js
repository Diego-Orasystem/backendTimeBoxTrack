const express = require('express');
const { body, param } = require('express-validator');
const PersonaController = require('../controllers/personaController');

const router = express.Router();

// Validaciones
const personaValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('rol').optional().isLength({ max: 50 }).withMessage('El rol no puede exceder 50 caracteres'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('habilidades').optional().isArray().withMessage('Las habilidades deben ser un array')
];

const updatePersonaValidation = [
  param('id').notEmpty().withMessage('ID de persona es requerido')
    .isUUID().withMessage('ID debe ser un UUID válido'),
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('rol').optional().isLength({ max: 50 }).withMessage('El rol no puede exceder 50 caracteres'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('habilidades').optional().isArray().withMessage('Las habilidades deben ser un array')
];

const idValidation = [
  param('id').notEmpty().withMessage('ID es requerido')
    .isUUID().withMessage('ID debe ser un UUID válido')
];

const roleValidation = [
  param('rol').notEmpty().withMessage('Rol es requerido')
    .isLength({ min: 1, max: 50 }).withMessage('El rol debe tener entre 1 y 50 caracteres')
];

// Rutas según la estructura estándar
// GET /api/personas - Obtener todas las personas
router.get('/', PersonaController.getAllPersonas);

// GET /api/personas/roles - Obtener todos los roles disponibles
router.get('/roles', PersonaController.getAllRoles);

// GET /api/personas/rol/:rol - Obtener personas por rol
router.get('/rol/:rol', roleValidation, PersonaController.getPersonasByRole);

// GET /api/personas/:id - Obtener persona por ID
router.get('/:id', idValidation, PersonaController.getPersonaById);

// POST /api/personas - Crear nueva persona
router.post('/', personaValidation, PersonaController.createPersona);

// PUT /api/personas/:id - Actualizar persona
router.put('/:id', updatePersonaValidation, PersonaController.updatePersona);

// DELETE /api/personas/:id - Eliminar persona
router.delete('/:id', idValidation, PersonaController.deletePersona);

module.exports = router;