const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

class TimeboxMaintainerController {
  // ===== CATEGORÍAS =====
  
  // Obtener todas las categorías
  static async getAllCategories(req, res) {
    try {
      const sql = 'SELECT * FROM timebox_categories ORDER BY nombre';
      const categories = await executeQuery(sql);
      
      res.json({
        status: true,
        message: 'Categorías obtenidas exitosamente',
        data: categories
      });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Crear nueva categoría
  static async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { nombre } = req.body;
      const id = req.body.id || uuidv4();
      
      const sql = 'INSERT INTO timebox_categories (id, nombre) VALUES (?, ?)';
      await executeQuery(sql, [id, nombre]);
      
      const newCategory = await executeQuery('SELECT * FROM timebox_categories WHERE id = ?', [id]);
      
      res.status(201).json({
        status: true,
        message: 'Categoría creada exitosamente',
        data: newCategory[0]
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener categoría por ID
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const sql = 'SELECT * FROM timebox_categories WHERE id = ?';
      const category = await executeQuery(sql, [id]);
      
      if (!category[0]) {
        return res.status(404).json({
          status: false,
          message: 'Categoría no encontrada'
        });
      }

      res.json({
        status: true,
        message: 'Categoría obtenida exitosamente',
        data: category[0]
      });
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar categoría
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { nombre } = req.body;
      const sql = 'UPDATE timebox_categories SET nombre = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(sql, [nombre, id]);
      
      const updatedCategory = await executeQuery('SELECT * FROM timebox_categories WHERE id = ?', [id]);
      
      if (!updatedCategory[0]) {
        return res.status(404).json({
          status: false,
          message: 'Categoría no encontrada'
        });
      }

      res.json({
        status: true,
        message: 'Categoría actualizada exitosamente',
        data: updatedCategory[0]
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar categoría
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const sql = 'DELETE FROM timebox_categories WHERE id = ?';
      const result = await executeQuery(sql, [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: 'Categoría no encontrada'
        });
      }

      res.json({
        status: true,
        message: 'Categoría eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // ===== TIPOS =====
  
  // Obtener todos los tipos
  static async getAllTypes(req, res) {
    try {
      const sql = `
        SELECT tt.*, tc.nombre as categoria_nombre 
        FROM timebox_types tt 
        LEFT JOIN timebox_categories tc ON tt.categoria_id = tc.id 
        ORDER BY tt.nombre
      `;
      const types = await executeQuery(sql);
      
      res.json({
        status: true,
        message: 'Tipos obtenidos exitosamente',
        data: types
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

  // Crear nuevo tipo
  static async createType(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { nombre, definicion, categoriaId, entregablesComunes, evidenciasCierre } = req.body;
      const id = req.body.id || uuidv4();
      
      const sql = `
        INSERT INTO timebox_types (id, nombre, definicion, categoria_id, entregables_comunes, evidencias_cierre) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await executeQuery(sql, [
        id, 
        nombre, 
        definicion || null, 
        categoriaId, 
        JSON.stringify(entregablesComunes || []), 
        JSON.stringify(evidenciasCierre || [])
      ]);
      
      const newType = await executeQuery(`
        SELECT tt.*, tc.nombre as categoria_nombre 
        FROM timebox_types tt 
        LEFT JOIN timebox_categories tc ON tt.categoria_id = tc.id 
        WHERE tt.id = ?
      `, [id]);
      
      res.status(201).json({
        status: true,
        message: 'Tipo creado exitosamente',
        data: newType[0]
      });
    } catch (error) {
      console.error('Error al crear tipo:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener tipo por ID
  static async getTypeById(req, res) {
    try {
      const { id } = req.params;
      const sql = `
        SELECT tt.*, tc.nombre as categoria_nombre 
        FROM timebox_types tt 
        LEFT JOIN timebox_categories tc ON tt.categoria_id = tc.id 
        WHERE tt.id = ?
      `;
      const type = await executeQuery(sql, [id]);
      
      if (!type[0]) {
        return res.status(404).json({
          status: false,
          message: 'Tipo no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Tipo obtenido exitosamente',
        data: type[0]
      });
    } catch (error) {
      console.error('Error al obtener tipo:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar tipo
  static async updateType(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { nombre, definicion, categoriaId, entregablesComunes, evidenciasCierre } = req.body;
      const sql = `
        UPDATE timebox_types 
        SET nombre = ?, definicion = ?, categoria_id = ?, entregables_comunes = ?, evidencias_cierre = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      await executeQuery(sql, [
        nombre, 
        definicion || null, 
        categoriaId, 
        JSON.stringify(entregablesComunes || []), 
        JSON.stringify(evidenciasCierre || []), 
        id
      ]);
      
      const updatedType = await executeQuery(`
        SELECT tt.*, tc.nombre as categoria_nombre 
        FROM timebox_types tt 
        LEFT JOIN timebox_categories tc ON tt.categoria_id = tc.id 
        WHERE tt.id = ?
      `, [id]);
      
      if (!updatedType[0]) {
        return res.status(404).json({
          status: false,
          message: 'Tipo no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Tipo actualizado exitosamente',
        data: updatedType[0]
      });
    } catch (error) {
      console.error('Error al actualizar tipo:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar tipo
  static async deleteType(req, res) {
    try {
      const { id } = req.params;
      const sql = 'DELETE FROM timebox_types WHERE id = ?';
      const result = await executeQuery(sql, [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: 'Tipo no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Tipo eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar tipo:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = TimeboxMaintainerController; 