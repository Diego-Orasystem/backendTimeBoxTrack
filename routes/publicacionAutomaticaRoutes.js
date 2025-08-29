const express = require('express');
const router = express.Router();
const publicacionAutomaticaController = require('../controllers/publicacionAutomaticaController');

// Obtener roles disponibles para un timebox
router.get('/:timeboxId/roles-disponibles', publicacionAutomaticaController.getRolesDisponibles);

// Crear publicaciones automáticas para todos los roles
router.post('/:timeboxId/publicaciones-automaticas', publicacionAutomaticaController.crearPublicacionesAutomaticas);

// Publicar una oferta específica
router.put('/:publicacionId/publicar', publicacionAutomaticaController.publicarOferta);

// Obtener todas las publicaciones de un timebox
router.get('/:timeboxId/publicaciones', publicacionAutomaticaController.getPublicacionesPorTimebox);

module.exports = router;
