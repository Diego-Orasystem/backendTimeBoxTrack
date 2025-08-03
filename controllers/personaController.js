const { validationResult } = require('express-validator');
const Persona = require('../models/Persona');

class PersonaController {
  // Obtener todas las personas
  static async getAllPersonas(req, res) {
    try {
      const personas = await Persona.findAll();
      res.json({
        status: true,
        message: 'Personas obtenidas exitosamente',
        data: personas
      });
    } catch (error) {
      console.error('Error al obtener personas:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener persona por ID
  static async getPersonaById(req, res) {
    try {
      const { id } = req.params;
      const persona = await Persona.findById(id);
      
      if (!persona) {
        return res.status(404).json({
          status: false,
          message: 'Persona no encontrada'
        });
      }

      res.json({
        status: true,
        message: 'Persona obtenida exitosamente',
        data: persona
      });
    } catch (error) {
      console.error('Error al obtener persona:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Crear nueva persona
  static async createPersona(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const personaData = req.body;
      const newPersona = await Persona.create(personaData);
      
      res.status(201).json({
        status: true,
        message: 'Persona creada exitosamente',
        data: newPersona
      });
    } catch (error) {
      console.error('Error al crear persona:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar persona existente
  static async updatePersona(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const personaData = req.body;
      const updatedPersona = await Persona.update(id, personaData);
      
      if (!updatedPersona) {
        return res.status(404).json({
          status: false,
          message: 'Persona no encontrada'
        });
      }

      res.json({
        status: true,
        message: 'Persona actualizada exitosamente',
        data: updatedPersona
      });
    } catch (error) {
      console.error('Error al actualizar persona:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar persona
  static async deletePersona(req, res) {
    try {
      const { id } = req.params;
      const result = await Persona.delete(id);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: 'Persona no encontrada'
        });
      }

      res.json({
        status: true,
        message: 'Persona eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar persona:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener personas por rol
  static async getPersonasByRole(req, res) {
    try {
      const { rol } = req.params;
      const personas = await Persona.findByRole(rol);
      
      res.json({
        status: true,
        message: `Personas con rol ${rol} obtenidas exitosamente`,
        data: personas
      });
    } catch (error) {
      console.error('Error al obtener personas por rol:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener todos los roles disponibles
  static async getAllRoles(req, res) {
    try {
      const roles = await Persona.getAllRoles();
      
      res.json({
        status: true,
        message: 'Roles obtenidos exitosamente',
        data: roles
      });
    } catch (error) {
      console.error('Error al obtener roles:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = PersonaController;