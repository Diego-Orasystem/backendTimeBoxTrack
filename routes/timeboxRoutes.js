const express = require('express');
const { body, param } = require('express-validator');
const TimeboxController = require('../controllers/timeboxController');

const router = express.Router();

// Validaciones
const timeboxValidation = [
  body('tipoTimeboxId').notEmpty().withMessage('El tipo de timebox es requerido'),
  body('projectId').notEmpty().withMessage('El proyecto es requerido'),
  body('estado').optional().custom((value) => {
    const estadosValidos = ['En Definición', 'En Definicion', 'Disponible', 'En Ejecución', 'En Ejecucion', 'Finalizado'];
    if (!estadosValidos.includes(value)) {
      throw new Error('Estado inválido');
    }
    return true;
  }).withMessage('Estado inválido'),
  body('monto').optional().custom((value) => {
    if (value === null || value === undefined) {
      return true; // Permitir null/undefined
    }
    if (isNaN(value)) {
      throw new Error('El monto debe ser numérico');
    }
    return true;
  }).withMessage('El monto debe ser numérico')
];

const timeboxTypeValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('definicion').notEmpty().withMessage('La definición es requerida'),
  body('categoria_id').optional().isUUID().withMessage('ID de categoría inválido'),
  body('entregablesComunes').optional().isArray().withMessage('Los entregables deben ser un array'),
  body('evidenciasCierre').optional().isArray().withMessage('Las evidencias deben ser un array')
];

const categoryValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('descripcion').optional().isString().withMessage('La descripción debe ser texto')
];

const updateTimeboxValidation = [
  param('id').notEmpty().withMessage('ID de timebox es requerido'),
  body('tipoTimeboxId').optional().notEmpty().withMessage('El tipo de timebox no puede estar vacío'),
  body('projectId').optional().notEmpty().withMessage('El proyecto no puede estar vacío'),
  body('estado').optional().custom((value) => {
    const estadosValidos = ['En Definición', 'En Definicion', 'Disponible', 'En Ejecución', 'En Ejecucion', 'Finalizado'];
    if (!estadosValidos.includes(value)) {
      throw new Error('Estado inválido');
    }
    return true;
  }).withMessage('Estado inválido'),
  body('monto').optional().custom((value) => {
    if (value === null || value === undefined) {
      return true; // Permitir null/undefined
    }
    if (isNaN(value)) {
      throw new Error('El monto debe ser numérico');
    }
    return true;
  }).withMessage('El monto debe ser numérico')
];

const idValidation = [
  param('id').notEmpty().withMessage('ID es requerido')
];

const projectIdValidation = [
  param('projectId').notEmpty().withMessage('ID de proyecto es requerido')
];

// Rutas
// GET /api/timeboxes - Obtener todos los timeboxes
router.get('/', TimeboxController.getAllTimeboxes);

// GET /api/timeboxes/stats - Obtener estadísticas
router.get('/stats', TimeboxController.getTimeboxStats);

// GET /api/timeboxes/with-postulations - Obtener timeboxes con postulaciones
router.get('/with-postulations', TimeboxController.getTimeboxesWithPostulations);

// Rutas para tipos de timebox (DEBEN IR ANTES DE LAS RUTAS CON PARÁMETROS)
// GET /api/timeboxes/types - Obtener todos los tipos de timebox
router.get('/types', TimeboxController.getAllTimeboxTypes);

// GET /api/timeboxes/types/:id - Obtener tipo de timebox por ID
router.get('/types/:id', idValidation, TimeboxController.getTimeboxTypeById);

// Rutas para categorías de timebox (DEBEN IR ANTES DE LAS RUTAS CON PARÁMETROS)
// GET /api/timeboxes/categories - Obtener todas las categorías de timebox
router.get('/categories', TimeboxController.getAllTimeboxCategories);

// ===== CRUD PARA TIMEBOX TYPES =====
// POST /api/timeboxes/types - Crear nuevo tipo de timebox
router.post('/types', timeboxTypeValidation, TimeboxController.createTimeboxType);

// PUT /api/timeboxes/types/:id - Actualizar tipo de timebox
router.put('/types/:id', [...idValidation, ...timeboxTypeValidation], TimeboxController.updateTimeboxType);

// DELETE /api/timeboxes/types/:id - Eliminar tipo de timebox
router.delete('/types/:id', idValidation, TimeboxController.deleteTimeboxType);

// ===== CRUD PARA CATEGORÍAS =====
// POST /api/timeboxes/categories - Crear nueva categoría
router.post('/categories', categoryValidation, TimeboxController.createTimeboxCategory);

// PUT /api/timeboxes/categories/:id - Actualizar categoría
router.put('/categories/:id', [...idValidation, ...categoryValidation], TimeboxController.updateTimeboxCategory);

// DELETE /api/timeboxes/categories/:id - Eliminar categoría
router.delete('/categories/:id', idValidation, TimeboxController.deleteTimeboxCategory);

// GET /api/timeboxes/project/:projectId - Obtener timeboxes por proyecto
router.get('/project/:projectId', projectIdValidation, TimeboxController.getTimeboxesByProject);

// POST /api/timeboxes - Crear nuevo timebox
router.post('/', timeboxValidation, TimeboxController.createTimebox);

// PUT /api/timeboxes/:id - Actualizar timebox
router.put('/:id', updateTimeboxValidation, TimeboxController.updateTimebox);

// PATCH /api/timeboxes/:id/estado - Actualizar estado del timebox
router.patch('/:id/estado', [
  ...idValidation,
  body('estado').notEmpty().custom((value) => {
    const estadosValidos = ['En Definición', 'En Definicion', 'Disponible', 'En Ejecución', 'En Ejecucion', 'Finalizado'];
    if (!estadosValidos.includes(value)) {
      throw new Error('Estado inválido');
    }
    return true;
  }).withMessage('Estado inválido')
], TimeboxController.updateTimeboxEstado);

// DELETE /api/timeboxes/:id - Eliminar timebox
router.delete('/:id', idValidation, TimeboxController.deleteTimebox);

// GET /api/timeboxes/:id - Obtener timebox por ID (DEBE IR AL FINAL)
router.get('/:id', idValidation, TimeboxController.getTimeboxById);

// GET /api/timeboxes/:id/fases - Obtener timebox con fases (DEBE IR AL FINAL)
router.get('/:id/fases', idValidation, TimeboxController.getTimeboxWithFases);

module.exports = router; 