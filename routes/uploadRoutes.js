const express = require('express');
const { param } = require('express-validator');
const UploadController = require('../controllers/uploadController');

const router = express.Router();

// Validaciones
const idValidation = [
  param('id').notEmpty().withMessage('ID es requerido')
    .isUUID().withMessage('ID debe ser un UUID válido')
];

// Rutas de upload
// POST /api/upload - Subir archivo
router.post('/', UploadController.uploadFile);

// GET /api/upload/:id - Obtener archivo por ID
router.get('/:id', idValidation, UploadController.getFileById);

// DELETE /api/upload/:id - Eliminar archivo
router.delete('/:id', idValidation, UploadController.deleteFile);

module.exports = router; 