const express = require('express');
const { body, param } = require('express-validator');
const FinanceController = require('../controllers/financeController');

const router = express.Router();

// Mis pagos (pagos del developer específico)
router.get('/mis-pagos/:developerId', (req, res) => FinanceController.getMisPagos(req, res));

// Órdenes de pago (listado con filtros opcionales)
router.get('/ordenes-pago', (req, res) => FinanceController.getOrdenesPago(req, res));

// Crear una orden de pago
router.post(
  '/ordenes-pago',
  [
    body('developerId').isString().notEmpty(),
    body('monto').isFloat({ gt: 0 }),
    body('moneda').isString().isLength({ min: 1, max: 10 }),
    body('concepto').optional().isString(),
    body('fechaEmision').optional().isISO8601().toDate(),
  ],
  (req, res) => FinanceController.createOrdenPago(req, res)
);

// Actualizar estado de una orden de pago
router.put(
  '/ordenes-pago/:id/estado',
  [
    body('estado').isIn(['Pendiente', 'Aprobada', 'Pagada', 'Rechazada']),
  ],
  (req, res) => FinanceController.updateEstadoOrden(req, res)
);

// Subir comprobante de pago
router.post(
  '/ordenes-pago/:id/comprobante',
  FinanceController.uploadFinanzas.single('archivo'),
  [
    body('referencia').isString().notEmpty(),
  ],
  (req, res) => FinanceController.subirComprobante(req, res)
);

module.exports = router;


