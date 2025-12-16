const { validationResult } = require('express-validator');
const Entregable = require('../models/Entregable');

class EntregableController {
  // Obtener todos los entregables
  static async getAllEntregables(req, res) {
    try {
      const entregables = await Entregable.findAll();
      res.json({
        status: true,
        message: 'Entregables obtenidos exitosamente',
        data: entregables
      });
    } catch (error) {
      console.error('Error al obtener entregables:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener entregable por ID
  static async getEntregableById(req, res) {
    try {
      const { id } = req.params;
      const entregable = await Entregable.findById(id);
      
      if (!entregable) {
        return res.status(404).json({
          status: false,
          message: 'Entregable no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Entregable obtenido exitosamente',
        data: entregable
      });
    } catch (error) {
      console.error('Error al obtener entregable:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Crear nuevo entregable
  static async createEntregable(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const entregableData = req.body;
      const newEntregable = await Entregable.create(entregableData);
      
      res.status(201).json({
        status: true,
        message: 'Entregable creado exitosamente',
        data: newEntregable
      });
    } catch (error) {
      console.error('Error al crear entregable:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar entregable existente
  static async updateEntregable(req, res) {
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
      const entregableData = req.body;
      const updatedEntregable = await Entregable.update(id, entregableData);
      
      if (!updatedEntregable) {
        return res.status(404).json({
          status: false,
          message: 'Entregable no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Entregable actualizado exitosamente',
        data: updatedEntregable
      });
    } catch (error) {
      console.error('Error al actualizar entregable:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar entregable
  static async deleteEntregable(req, res) {
    try {
      const { id } = req.params;
      const result = await Entregable.delete(id);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: 'Entregable no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Entregable eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar entregable:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener entregables por producto
  static async getEntregablesByProduct(req, res) {
    try {
      const { productId } = req.params;
      const entregables = await Entregable.findByProduct(productId);
      
      res.json({
        status: true,
        message: 'Entregables del producto obtenidos exitosamente',
        data: entregables
      });
    } catch (error) {
      console.error('Error al obtener entregables por producto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener entregables por tipo
  static async getEntregablesByTipo(req, res) {
    try {
      const { tipo } = req.params;
      const entregables = await Entregable.findByTipo(tipo);
      
      res.json({
        status: true,
        message: `Entregables de tipo ${tipo} obtenidos exitosamente`,
        data: entregables
      });
    } catch (error) {
      console.error('Error al obtener entregables por tipo:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Buscar entregables por nombre
  static async searchEntregablesByName(req, res) {
    try {
      const { name } = req.query;
      
      if (!name) {
        return res.status(400).json({
          status: false,
          message: 'El parámetro name es requerido'
        });
      }

      const entregables = await Entregable.searchByName(name);
      
      res.json({
        status: true,
        message: 'Búsqueda realizada exitosamente',
        data: entregables
      });
    } catch (error) {
      console.error('Error al buscar entregables:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener entregables por entregableId (relación padre-hijo)
  static async getEntregablesByEntregableId(req, res) {
    try {
      const { entregableId } = req.params;
      const entregables = await Entregable.findByEntregableId(entregableId);
      
      res.json({
        status: true,
        message: 'Entregables relacionados obtenidos exitosamente',
        data: entregables
      });
    } catch (error) {
      console.error('Error al obtener entregables relacionados:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener todos los tipos disponibles
  static async getAllTipos(req, res) {
    try {
      const tipos = await Entregable.getAllTipos();
      
      res.json({
        status: true,
        message: 'Tipos obtenidos exitosamente',
        data: tipos
      });
    } catch (error) {
      console.error('Error al obtener tipos:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  static async getInfoEntregableTimeboxes(req, res) {
    try {
      const { entregableId } = req.params;
      let entregable = await Entregable.findById(entregableId);
      if (!entregable) {
        return res.status(404).json({
          status: false,
          message: 'Entregable no encontrado'
        });
      }
      const timeboxes = await Timebox.findByEntregableId(entregableId);
      // Agregar tomeboxes al entregable
      entregable.timeboxes = timeboxes;
      res.json({
        status: true,
        message: 'Información del entregable y sus timeboxes obtenida exitosamente',
        data: {
          entregable,
        }
      });
    } catch (error) {
      console.error('Error al obtener información del entregable y sus timeboxes:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = EntregableController;