const express = require('express');
const { body, param } = require('express-validator');
const TimeboxMaintainerController = require('../controllers/timeboxMaintainerController');

const router = express.Router();

// Validaciones
const categoryValidation = [
  body('nombre').notEmpty().withMessage('El nombre de la categoría es requerido')
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres')
];

const typeValidation = [
  body('nombre').notEmpty().withMessage('El nombre del tipo es requerido')
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('definicion').optional().isLength({ max: 500 }).withMessage('La definición no puede exceder 500 caracteres'),
  body('categoriaId').notEmpty().withMessage('La categoría es requerida'),
  body('entregablesComunes').optional().isArray().withMessage('Los entregables deben ser un array'),
  body('evidenciasCierre').optional().isArray().withMessage('Las evidencias deben ser un array')
];

const idValidation = [
  param('id').notEmpty().withMessage('ID es requerido')
];

// Rutas de Categorías
// GET /api/timebox/maintainer/categories - Obtener todas las categorías
router.get('/categories', TimeboxMaintainerController.getAllCategories);

// POST /api/timebox/maintainer/categories - Crear nueva categoría
router.post('/categories', categoryValidation, TimeboxMaintainerController.createCategory);

// GET /api/timebox/maintainer/categories/:id - Obtener categoría por ID
router.get('/categories/:id', idValidation, TimeboxMaintainerController.getCategoryById);

// PUT /api/timebox/maintainer/categories/:id - Actualizar categoría
router.put('/categories/:id', [
  ...idValidation,
  ...categoryValidation
], TimeboxMaintainerController.updateCategory);

// DELETE /api/timebox/maintainer/categories/:id - Eliminar categoría
router.delete('/categories/:id', idValidation, TimeboxMaintainerController.deleteCategory);

// Rutas de Tipos
// GET /api/timebox/maintainer/types - Obtener todos los tipos
router.get('/types', TimeboxMaintainerController.getAllTypes);

// POST /api/timebox/maintainer/types - Crear nuevo tipo
router.post('/types', typeValidation, TimeboxMaintainerController.createType);

// GET /api/timebox/maintainer/types/:id - Obtener tipo por ID
router.get('/types/:id', idValidation, TimeboxMaintainerController.getTypeById);

// PUT /api/timebox/maintainer/types/:id - Actualizar tipo
router.put('/types/:id', [
  ...idValidation,
  ...typeValidation
], TimeboxMaintainerController.updateType);

// DELETE /api/timebox/maintainer/types/:id - Eliminar tipo
router.delete('/types/:id', idValidation, TimeboxMaintainerController.deleteType);

module.exports = router; 