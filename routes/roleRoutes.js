const express = require('express');
const roleController = require('../controllers/roleController');
const { body } = require('express-validator');

const router = express.Router();

// Validaciones
const sueldoValidation = [
  body('sueldo_base_semanal')
    .isFloat({ min: 0 })
    .withMessage('El sueldo debe ser un número mayor o igual a 0'),
  body('moneda')
    .isIn(['USD', 'CLP'])
    .withMessage('La moneda debe ser USD o CLP')
];

// GET /api/roles - Obtener todos los roles con sueldos
router.get('/', roleController.getAllRolesWithSueldos);

// GET /api/roles/stats - Obtener estadísticas de sueldos
router.get('/stats', roleController.getSueldosStats);

// GET /api/roles/:id - Obtener rol específico con sueldo
router.get('/:id', roleController.getRoleById);

// PUT /api/roles/:id/sueldo - Actualizar sueldo de un rol
router.put('/:id/sueldo', sueldoValidation, roleController.updateRoleSueldo);

module.exports = router;
