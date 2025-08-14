const express = require('express');
const { body, param } = require('express-validator');
const ProjectController = require('../controllers/projectController');
const TimeboxController = require('../controllers/timeboxController');

const router = express.Router();

// Validaciones
const projectValidation = [
  body('nombre').notEmpty().withMessage('El nombre del proyecto es requerido')
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),
  body('descripcion').optional().isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres')
];

const updateProjectValidation = [
  param('id').notEmpty().withMessage('ID de proyecto es requerido'),
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),
  body('descripcion').optional().isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres')
];

const contentValidation = [
  body('nombre').notEmpty().withMessage('El nombre del contenido es requerido')
    .isLength({ min: 1, max: 200 }).withMessage('El nombre debe tener entre 1 y 200 caracteres'),
  body('tipo').notEmpty().isIn(['Carpeta', 'Documento', 'Video', 'Imagen', 'Imágen'])
    .withMessage('Tipo de contenido inválido'),
  body('descripcion').optional().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('parentId').optional().custom((value) => {
    if (value === null || value === undefined) {
      return true; // Permitir null/undefined para contenido raíz
    }
    // Si tiene valor, debe ser un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('ID de padre inválido');
    }
    return true;
  }).withMessage('ID de padre inválido'),
  body('adjuntoId').optional().isUUID().withMessage('ID de adjunto inválido')
];

const idValidation = [
  param('id').notEmpty().withMessage('ID es requerido')
];

const projectIdValidation = [
  param('projectId').notEmpty().withMessage('ID de proyecto es requerido')
];

const contentIdValidation = [
  param('contentId').notEmpty().withMessage('ID de contenido es requerido')
];

// Rutas según la documentación API
// GET /api/project/all - Obtener todos los proyectos
router.get('/all', ProjectController.getAllProjects);

// GET /api/project/stats - Obtener estadísticas
router.get('/stats', ProjectController.getProjectStats);

// GET /api/project/:id - Obtener proyecto por ID
router.get('/:id', idValidation, ProjectController.getProjectById);

// GET /api/project/:id/content - Obtener proyecto con contenido
router.get('/:id/content', idValidation, ProjectController.getProjectWithContent);

// POST /api/project - Crear nuevo proyecto
router.post('/', projectValidation, ProjectController.createProject);

// PUT /api/project/:id - Actualizar proyecto
router.put('/:id', updateProjectValidation, ProjectController.updateProject);

// DELETE /api/project/:id - Eliminar proyecto
router.delete('/:id', idValidation, ProjectController.deleteProject);

// GET /api/project/content/:contentId - Obtener contenido específico
router.get('/content/:contentId', contentIdValidation, ProjectController.getContentById);

// POST /api/project/content - Agregar contenido al proyecto
router.post('/content', contentValidation, ProjectController.addProjectContent);

// PUT /api/project/content/:contentId - Actualizar contenido del proyecto
router.put('/content/:contentId', [
  ...contentIdValidation,
  ...contentValidation
], ProjectController.updateProjectContent);

// DELETE /api/project/content/:contentId - Eliminar contenido del proyecto
router.delete('/content/:contentId', contentIdValidation, ProjectController.deleteProjectContent);

// Rutas de Timeboxes según la documentación
// POST /api/project/:projectId/timeboxes - Crear timebox
router.post('/:projectId/timeboxes', [
  ...projectIdValidation,
  body('tipoTimeboxId').notEmpty().withMessage('El tipo de timebox es requerido'),
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
], (req, res) => TimeboxController.createTimebox(req, res));

// GET /api/project/:projectId/timeboxes - Obtener timeboxes del proyecto
router.get('/:projectId/timeboxes', projectIdValidation, (req, res) => TimeboxController.getTimeboxesByProject(req, res));

// GET /api/project/:projectId/timeboxes/:timeboxId - Obtener timebox específico
router.get('/:projectId/timeboxes/:timeboxId', [
  ...projectIdValidation,
  param('timeboxId').notEmpty().withMessage('ID de timebox es requerido')
], (req, res) => TimeboxController.getTimeboxById(req, res));

// PUT /api/project/:projectId/timeboxes/:timeboxId - Actualizar timebox
router.put('/:projectId/timeboxes/:timeboxId', [
  ...projectIdValidation,
  param('timeboxId').notEmpty().withMessage('ID de timebox es requerido'),
  body('tipoTimeboxId').optional().notEmpty().withMessage('El tipo de timebox no puede estar vacío'),
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
], (req, res) => TimeboxController.updateTimebox(req, res));

// DELETE /api/project/:projectId/timeboxes/:timeboxId - Eliminar timebox
router.delete('/:projectId/timeboxes/:timeboxId', [
  ...projectIdValidation,
  param('timeboxId').notEmpty().withMessage('ID de timebox es requerido')
], (req, res) => TimeboxController.deleteTimebox(req, res));

module.exports = router; 