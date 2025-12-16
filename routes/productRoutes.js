const express = require('express');
const { body, param, query } = require('express-validator');
const ProductController = require('../controllers/productController');
const TimeboxController = require('../controllers/timeboxController');
const router = express.Router();

// Validaciones
const productValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 255 }).withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('idResponsable').notEmpty().withMessage('El ID del responsable es requerido')
    .isUUID().withMessage('El ID del responsable debe ser un UUID válido'),
  body('descripcion').optional().isString().withMessage('La descripción debe ser un texto').isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder los 1000 caracteres')  
];


const updateProductValidation = [
  param('id').notEmpty().withMessage('ID de producto es requerido')
    .isUUID().withMessage('ID debe ser un UUID válido'),
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 255 }).withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('idResponsable').optional().notEmpty().withMessage('El ID del responsable no puede estar vacío')
    .isUUID().withMessage('El ID del responsable debe ser un UUID válido'),
  body('descripcion').optional().isString().withMessage('La descripción debe ser un texto').isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder los 1000 caracteres')  
];

const idValidation = [
  param('id').notEmpty().withMessage('ID es requerido')
    .isUUID().withMessage('ID debe ser un UUID válido')
];

const productIdValidation = [
  param('productId').notEmpty().withMessage('productId es requerido')
    .isUUID().withMessage('productId debe ser un UUID válido')
];

const responsableValidation = [
  param('idResponsable').notEmpty().withMessage('ID del responsable es requerido')
    .isUUID().withMessage('ID del responsable debe ser un UUID válido')
];

const searchValidation = [
  query('name').notEmpty().withMessage('El parámetro name es requerido')
    .isLength({ min: 1, max: 255 }).withMessage('El nombre debe tener entre 1 y 255 caracteres')
];

const projectIdValidation = [
  param('projectId').notEmpty().withMessage('ID del proyecto es requerido')
    .isUUID().withMessage('ID del proyecto debe ser un UUID válido')
];

// GET /api/products - Obtener todos los productos
router.get('/all', ProductController.getAllProducts);

// GET /api/products/search - Buscar productos por nombre
router.get('/search', searchValidation, ProductController.searchProductsByName);

// GET /api/products/responsable/:idResponsable - Obtener productos por responsable
router.get('/responsable/:idResponsable', responsableValidation, ProductController.getProductsByResponsable);

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', idValidation, ProductController.getProductById);

// Get /details/:productId - Obtener todos los detalles de entregables por producto, retorna entregables y timeboxes asociados
router.get('/details/:productId', productIdValidation, ProductController.getEntregablesDetailsByProduct);

// POST /api/products - Crear nuevo producto
router.post('/', productValidation, ProductController.createProduct);

// PUT /api/products/:id - Actualizar producto
router.put('/:id', updateProductValidation, ProductController.updateProduct);

// DELETE /api/products/:id - Eliminar producto (soft delete)
router.delete('/:id', idValidation, ProductController.deleteProduct);
// GET /api/products/:projectId/timeboxes - Obtener timeboxes por ID de producto
router.get('/:projectId/timeboxes', projectIdValidation, (req, res) => TimeboxController.getTimeboxesByProject(req, res));
module.exports = router;