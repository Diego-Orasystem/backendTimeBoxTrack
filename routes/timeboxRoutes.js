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
router.get('/', (req, res) => TimeboxController.getAllTimeboxes(req, res));

// GET /api/timeboxes/stats - Obtener estadísticas
router.get('/stats', (req, res) => TimeboxController.getTimeboxStats(req, res));

// GET /api/timeboxes/with-postulations - Obtener timeboxes con postulaciones
router.get('/with-postulations', (req, res) => TimeboxController.getTimeboxesWithPostulations(req, res));

// GET /api/timeboxes/published - Obtener timeboxes publicados
router.get('/published', (req, res) => TimeboxController.getPublishedTimeboxes(req, res));

// Rutas para tipos de timebox (DEBEN IR ANTES DE LAS RUTAS CON PARÁMETROS)
// GET /api/timeboxes/types - Obtener todos los tipos de timebox
router.get('/types', (req, res) => TimeboxController.getAllTimeboxTypes(req, res));

// GET /api/timeboxes/types/:id - Obtener tipo de timebox por ID
router.get('/types/:id', idValidation, (req, res) => TimeboxController.getTimeboxTypeById(req, res));

// Rutas para categorías de timebox (DEBEN IR ANTES DE LAS RUTAS CON PARÁMETROS)
// GET /api/timeboxes/categories - Obtener todas las categorías de timebox
router.get('/categories', (req, res) => TimeboxController.getAllTimeboxCategories(req, res));

// ===== CRUD PARA TIMEBOX TYPES =====
// POST /api/timeboxes/types - Crear nuevo tipo de timebox
router.post('/types', timeboxTypeValidation, (req, res) => TimeboxController.createTimeboxType(req, res));

// PUT /api/timeboxes/types/:id - Actualizar tipo de timebox
router.put('/types/:id', [...idValidation, ...timeboxTypeValidation], (req, res) => TimeboxController.updateTimeboxType(req, res));

// DELETE /api/timeboxes/types/:id - Eliminar tipo de timebox
router.delete('/types/:id', idValidation, (req, res) => TimeboxController.deleteTimeboxType(req, res));

// ===== CRUD PARA CATEGORÍAS =====
// POST /api/timeboxes/categories - Crear nueva categoría
router.post('/categories', categoryValidation, (req, res) => TimeboxController.createTimeboxCategory(req, res));

// PUT /api/timeboxes/categories/:id - Actualizar categoría
router.put('/categories/:id', [...idValidation, ...categoryValidation], (req, res) => TimeboxController.updateTimeboxCategory(req, res));

// DELETE /api/timeboxes/categories/:id - Eliminar categoría
router.delete('/categories/:id', idValidation, (req, res) => TimeboxController.deleteTimeboxCategory(req, res));

// GET /api/timeboxes/project/:projectId - Obtener timeboxes por proyecto
router.get('/project/:projectId', projectIdValidation, (req, res) => TimeboxController.getTimeboxesByProject(req, res));

// POST /api/timeboxes - Crear nuevo timebox
router.post('/', timeboxValidation, (req, res) => TimeboxController.createTimebox(req, res));

// PUT /api/timeboxes/:id - Actualizar timebox
router.put('/:id', updateTimeboxValidation, (req, res) => TimeboxController.updateTimebox(req, res));

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
], (req, res) => TimeboxController.updateTimeboxEstado(req, res));

// DELETE /api/timeboxes/:id - Eliminar timebox
router.delete('/:id', idValidation, (req, res) => TimeboxController.deleteTimebox(req, res));

// GET /api/timeboxes/:id - Obtener timebox por ID (DEBE IR AL FINAL)
router.get('/:id', idValidation, (req, res) => TimeboxController.getTimeboxById(req, res));

// GET /api/timeboxes/:id/fases - Obtener timebox con fases (DEBE IR AL FINAL)
router.get('/:id/fases', idValidation, (req, res) => TimeboxController.getTimeboxWithFases(req, res));

// PUT /api/timeboxes/:id/assign-role - Asignar rol a un timebox
router.put('/:id/assign-role', [
  ...idValidation,
  body('postulacionId').notEmpty().withMessage('ID de postulación requerido'),
  body('roleKey').notEmpty().withMessage('Rol requerido'),
  body('developerName').notEmpty().withMessage('Nombre del desarrollador requerido')
], (req, res) => TimeboxController.assignRoleToTimebox(req, res));

module.exports = router;