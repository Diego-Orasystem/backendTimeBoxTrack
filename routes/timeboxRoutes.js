const express = require('express');
const { body, param } = require('express-validator');
const timeboxController = require('../controllers/timeboxController');

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
router.get('/', (req, res) => timeboxController.getAllTimeboxes(req, res));

// GET /api/timeboxes/stats - Obtener estadísticas
router.get('/stats', (req, res) => timeboxController.getTimeboxStats(req, res));

// GET /api/timeboxes/with-postulations - Obtener timeboxes con postulaciones
router.get('/with-postulations', (req, res) => timeboxController.getTimeboxesWithPostulations(req, res));

// GET /api/timeboxes/published - Obtener timeboxes publicados
router.get('/published', (req, res) => timeboxController.getPublishedTimeboxes(req, res));

// Rutas para tipos de timebox (DEBEN IR ANTES DE LAS RUTAS CON PARÁMETROS)
// GET /api/timeboxes/types - Obtener todos los tipos de timebox
router.get('/types', (req, res) => timeboxController.getAllTimeboxTypes(req, res));

// GET /api/timeboxes/types/:id - Obtener tipo de timebox por ID
router.get('/types/:id', idValidation, (req, res) => timeboxController.getTimeboxTypeById(req, res));

// Rutas para categorías de timebox (DEBEN IR ANTES DE LAS RUTAS CON PARÁMETROS)
// GET /api/timeboxes/categories - Obtener todas las categorías de timebox
router.get('/categories', (req, res) => timeboxController.getAllTimeboxCategories(req, res));

// ===== CRUD PARA TIMEBOX TYPES =====
// POST /api/timeboxes/types - Crear nuevo tipo de timebox
router.post('/types', timeboxTypeValidation, (req, res) => timeboxController.createTimeboxType(req, res));

// PUT /api/timeboxes/types/:id - Actualizar tipo de timebox
router.put('/types/:id', [...idValidation, ...timeboxTypeValidation], (req, res) => timeboxController.updateTimeboxType(req, res));

// DELETE /api/timeboxes/types/:id - Eliminar tipo de timebox
router.delete('/types/:id', idValidation, (req, res) => timeboxController.deleteTimeboxType(req, res));

// ===== CRUD PARA CATEGORÍAS =====
// POST /api/timeboxes/categories - Crear nueva categoría
router.post('/categories', categoryValidation, (req, res) => timeboxController.createTimeboxCategory(req, res));

// PUT /api/timeboxes/categories/:id - Actualizar categoría
router.put('/categories/:id', [...idValidation, ...categoryValidation], (req, res) => timeboxController.updateTimeboxCategory(req, res));

// DELETE /api/timeboxes/categories/:id - Eliminar categoría
router.delete('/categories/:id', idValidation, (req, res) => timeboxController.deleteTimeboxCategory(req, res));

// GET /api/timeboxes/project/:projectId - Obtener timeboxes por proyecto
router.get('/project/:projectId', projectIdValidation, (req, res) => timeboxController.getTimeboxesByProject(req, res));

// POST /api/timeboxes - Crear nuevo timebox
router.post('/', timeboxValidation, (req, res) => timeboxController.createTimebox(req, res));

// PUT /api/timeboxes/:id - Actualizar timebox
router.put('/:id', updateTimeboxValidation, (req, res) => timeboxController.updateTimebox(req, res));

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
], (req, res) => timeboxController.updateTimeboxEstado(req, res));

// DELETE /api/timeboxes/:id - Eliminar timebox
router.delete('/:id', idValidation, (req, res) => timeboxController.deleteTimebox(req, res));

// GET /api/timeboxes/:id - Obtener timebox por ID (DEBE IR AL FINAL)
router.get('/:id', idValidation, (req, res) => timeboxController.getTimeboxById(req, res));

// GET /api/timeboxes/:id/fases - Obtener timebox con fases (DEBE IR AL FINAL)
router.get('/:id/fases', idValidation, (req, res) => timeboxController.getTimeboxWithFases(req, res));

// PUT /api/timeboxes/:id/assign-role - Asignar rol a un timebox
router.put('/:id/assign-role', [
  ...idValidation,
  body('postulacionId').notEmpty().withMessage('ID de postulación requerido'),
  body('roleKey').notEmpty().withMessage('Rol requerido'),
  body('developerName').notEmpty().withMessage('Nombre del desarrollador requerido')
], (req, res) => timeboxController.assignRoleToTimebox(req, res));

// PUT /api/timeboxes/:id/reject-postulation - Rechazar postulación
router.put('/:id/reject-postulation', [
  ...idValidation,
  body('postulacionId').notEmpty().withMessage('ID de postulación requerido'),
  body('motivo').optional().isString().withMessage('El motivo debe ser texto')
], (req, res) => timeboxController.rejectPostulation(req, res));

module.exports = router;