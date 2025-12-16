const express = require('express');
const { body, param, query } = require('express-validator');
const EntregableController = require('../controllers/entregableController');

const router = express.Router();

// Validaciones
const entregableValidation = [
  body('productId').notEmpty().withMessage('El ID del producto es requerido')
    .isUUID().withMessage('El ID del producto debe ser un UUID válido'),
  body('tipo').notEmpty().withMessage('El tipo es requerido')
    .isLength({ min: 1, max: 50 }).withMessage('El tipo debe tener entre 1 y 50 caracteres'),
  body('nombre').notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 255 }).withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('descripcion').notEmpty().withMessage('La descripción es requerida')
];

const updateEntregableValidation = [
  param('id').notEmpty().withMessage('ID de entregable es requerido')
    .isUUID().withMessage('ID debe ser un UUID válido'),
  body('productId').optional().notEmpty().withMessage('El ID del producto no puede estar vacío')
    .isUUID().withMessage('El ID del producto debe ser un UUID válido'),
  body('tipo').optional().notEmpty().withMessage('El tipo no puede estar vacío')
    .isLength({ min: 1, max: 50 }).withMessage('El tipo debe tener entre 1 y 50 caracteres'),
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 255 }).withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('descripcion').optional().notEmpty().withMessage('La descripción no puede estar vacía'),
  body('entregableId').optional().isUUID().withMessage('El ID del entregable debe ser un UUID válido')
];

const idValidation = [
  param('id').notEmpty().withMessage('ID es requerido')
    .isUUID().withMessage('ID debe ser un UUID válido')
];

const productIdValidation = [
  param('productId').notEmpty().withMessage('ID del producto es requerido')
    .isUUID().withMessage('ID del producto debe ser un UUID válido')
];

const tipoValidation = [
  param('tipo').notEmpty().withMessage('Tipo es requerido')
    .isLength({ min: 1, max: 50 }).withMessage('El tipo debe tener entre 1 y 50 caracteres')
];

const entregableIdValidation = [
  param('entregableId').notEmpty().withMessage('ID del entregable es requerido')
    .isUUID().withMessage('ID del entregable debe ser un UUID válido')
];

const searchValidation = [
  query('name').notEmpty().withMessage('El parámetro name es requerido')
    .isLength({ min: 1, max: 255 }).withMessage('El nombre debe tener entre 1 y 255 caracteres')
];

// GET /api/entregables - Obtener todos los entregables
router.get('/all', EntregableController.getAllEntregables);

// GET /api/entregables/tipos - Obtener todos los tipos disponibles
router.get('/tipos', EntregableController.getAllTipos);

// GET /api/entregables/search - Buscar entregables por nombre
router.get('/search', searchValidation, EntregableController.searchEntregablesByName);

// GET /api/entregables/product/:productId - Obtener entregables por producto
router.get('/product/:productId', productIdValidation, EntregableController.getEntregablesByProduct);

// GET /api/entregables/tipo/:tipo - Obtener entregables por tipo
router.get('/tipo/:tipo', tipoValidation, EntregableController.getEntregablesByTipo);

// GET /api/entregables/parent/:entregableId - Obtener entregables relacionados (padre-hijo)
router.get('/parent/:entregableId', entregableIdValidation, EntregableController.getEntregablesByEntregableId);

// GET /api/entregables/:id - Obtener entregable por ID
router.get('/:id', idValidation, EntregableController.getEntregableById);

// POST /api/entregables - Crear nuevo entregable
router.post('/', entregableValidation, EntregableController.createEntregable);

// PUT /api/entregables/:id - Actualizar entregable
router.put('/:id', updateEntregableValidation, EntregableController.updateEntregable);

// DELETE /api/entregables/:id - Eliminar entregable
router.delete('/:id', idValidation, EntregableController.deleteEntregable);

module.exports = router;