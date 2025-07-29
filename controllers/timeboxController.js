const { validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class TimeboxController {
  // Obtener todos los timeboxes
  static async getAllTimeboxes(req, res) {
    try {
      const sql = `
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        ORDER BY t.created_at DESC
      `;
      
      const timeboxes = await executeQuery(sql);
      
      res.json({
        status: true,
        message: 'Timeboxes obtenidos exitosamente',
        data: timeboxes
      });
    } catch (error) {
      console.error('Error al obtener timeboxes:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener timebox por ID
  static async getTimeboxById(req, res) {
    try {
      const { id } = req.params;
      
      const sql = `
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        WHERE t.id = ?
      `;
      
      const [timebox] = await executeQuery(sql, [id]);
      
      if (!timebox) {
        return res.status(404).json({
          status: false,
          message: 'Timebox no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Timebox obtenido exitosamente',
        data: timebox
      });
    } catch (error) {
      console.error('Error al obtener timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener timebox con fases
  static async getTimeboxWithFases(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener el timebox base
      const timeboxSql = `
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        WHERE t.id = ?
      `;
      
      const [timebox] = await executeQuery(timeboxSql, [id]);
      
      if (!timebox) {
        return res.status(404).json({
          status: false,
          message: 'Timebox no encontrado'
        });
      }

      // Obtener todas las fases
      const fases = {};
      
      // Planning phases
      const planningSql = `
        SELECT pp.*, p.nombre as team_leader_nombre
        FROM planning_phases pp
        LEFT JOIN personas p ON pp.team_leader_id = p.id
        WHERE pp.timebox_id = ?
      `;
      fases.planning = await executeQuery(planningSql, [id]);
      
      // Kickoff phases
      const kickoffSql = 'SELECT * FROM kickoff_phases WHERE timebox_id = ?';
      fases.kickoff = await executeQuery(kickoffSql, [id]);
      
      // Refinement phases
      const refinementSql = 'SELECT * FROM refinement_phases WHERE timebox_id = ?';
      fases.refinement = await executeQuery(refinementSql, [id]);
      
      // QA phases
      const qaSql = 'SELECT * FROM qa_phases WHERE timebox_id = ?';
      fases.qa = await executeQuery(qaSql, [id]);
      
      // Close phases
      const closeSql = 'SELECT * FROM close_phases WHERE timebox_id = ?';
      fases.close = await executeQuery(closeSql, [id]);
      
      // Entregas
      const entregaSql = 'SELECT * FROM entregas WHERE timebox_id = ?';
      fases.entregas = await executeQuery(entregaSql, [id]);

      res.json({
        status: true,
        message: 'Timebox con fases obtenido exitosamente',
        data: {
          ...timebox,
          fases
        }
      });
    } catch (error) {
      console.error('Error al obtener timebox con fases:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Crear nuevo timebox
  static async createTimebox(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { tipoTimeboxId, projectId, businessAnalystId, monto, estado } = req.body;
      const id = uuidv4();
      
      const sql = `
        INSERT INTO timeboxes (id, tipo_timebox_id, business_analyst_id, project_id, monto, estado)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await executeQuery(sql, [id, tipoTimeboxId, businessAnalystId || null, projectId, monto || null, estado || 'En Definicion']);
      
      // Obtener el timebox creado
      const [newTimebox] = await executeQuery(`
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        WHERE t.id = ?
      `, [id]);
      
      res.status(201).json({
        status: true,
        message: 'Timebox creado exitosamente',
        data: newTimebox
      });
    } catch (error) {
      console.error('Error al crear timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar timebox
  static async updateTimebox(req, res) {
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

      const { tipoTimeboxId, projectId, businessAnalystId, monto, estado } = req.body;
      
      // Verificar que el timebox existe
      const [existingTimebox] = await executeQuery('SELECT * FROM timeboxes WHERE id = ?', [id]);
      if (!existingTimebox) {
        return res.status(404).json({
          status: false,
          message: 'Timebox no encontrado'
        });
      }

      // Construir la consulta de actualización dinámicamente
      const updates = [];
      const values = [];
      
      if (tipoTimeboxId !== undefined) {
        updates.push('tipo_timebox_id = ?');
        values.push(tipoTimeboxId);
      }
      if (projectId !== undefined) {
        updates.push('project_id = ?');
        values.push(projectId);
      }
      if (businessAnalystId !== undefined) {
        updates.push('business_analyst_id = ?');
        values.push(businessAnalystId);
      }
      if (monto !== undefined) {
        updates.push('monto = ?');
        values.push(monto);
      }
      if (estado !== undefined) {
        updates.push('estado = ?');
        values.push(estado);
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const sql = `UPDATE timeboxes SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(sql, values);
      
      // Obtener el timebox actualizado
      const [updatedTimebox] = await executeQuery(`
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        WHERE t.id = ?
      `, [id]);

      res.json({
        status: true,
        message: 'Timebox actualizado exitosamente',
        data: updatedTimebox
      });
    } catch (error) {
      console.error('Error al actualizar timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar estado del timebox
  static async updateTimeboxEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      // Verificar que el timebox existe
      const [existingTimebox] = await executeQuery('SELECT * FROM timeboxes WHERE id = ?', [id]);
      if (!existingTimebox) {
        return res.status(404).json({
          status: false,
          message: 'Timebox no encontrado'
        });
      }

      const sql = 'UPDATE timeboxes SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(sql, [estado, id]);
      
      // Obtener el timebox actualizado
      const [updatedTimebox] = await executeQuery(`
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        WHERE t.id = ?
      `, [id]);

      res.json({
        status: true,
        message: 'Estado del timebox actualizado exitosamente',
        data: updatedTimebox
      });
    } catch (error) {
      console.error('Error al actualizar estado del timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar timebox
  static async deleteTimebox(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el timebox existe
      const [existingTimebox] = await executeQuery('SELECT * FROM timeboxes WHERE id = ?', [id]);
      if (!existingTimebox) {
        return res.status(404).json({
          status: false,
          message: 'Timebox no encontrado'
        });
      }

      const sql = 'DELETE FROM timeboxes WHERE id = ?';
      const result = await executeQuery(sql, [id]);
      
      res.json({
        status: true,
        message: 'Timebox eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener timeboxes por proyecto
  static async getTimeboxesByProject(req, res) {
    try {
      const { projectId } = req.params;
      
      const sql = `
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        WHERE t.project_id = ?
        ORDER BY t.created_at DESC
      `;
      
      const timeboxes = await executeQuery(sql, [projectId]);
      
      res.json({
        status: true,
        message: 'Timeboxes del proyecto obtenidos exitosamente',
        data: timeboxes
      });
    } catch (error) {
      console.error('Error al obtener timeboxes del proyecto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener estadísticas de timeboxes
  static async getTimeboxStats(req, res) {
    try {
      const statsSql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'En Definicion' THEN 1 ELSE 0 END) as en_definicion,
          SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponible,
          SUM(CASE WHEN estado = 'En Ejecucion' THEN 1 ELSE 0 END) as en_ejecucion,
          SUM(CASE WHEN estado = 'Finalizado' THEN 1 ELSE 0 END) as finalizado
        FROM timeboxes
      `;
      
      const [stats] = await executeQuery(statsSql);
      
      res.json({
        status: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener timeboxes con postulaciones
  static async getTimeboxesWithPostulations(req, res) {
    try {
      const sql = `
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre,
               COUNT(po.id) as num_postulaciones
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN publicacion_ofertas pub ON t.id = pub.timebox_id
        LEFT JOIN postulaciones po ON pub.id = po.publicacion_id
        GROUP BY t.id
        HAVING num_postulaciones > 0
        ORDER BY num_postulaciones DESC
      `;
      
      const timeboxes = await executeQuery(sql);
      
      res.json({
        status: true,
        message: 'Timeboxes con postulaciones obtenidos exitosamente',
        data: timeboxes
      });
    } catch (error) {
      console.error('Error al obtener timeboxes con postulaciones:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // ===== CRUD PARA TIMEBOX TYPES =====
  
  // Obtener todos los tipos de timebox
  static async getAllTimeboxTypes(req, res) {
    try {
      const sql = `
        SELECT tt.*, tc.nombre as categoria_nombre
        FROM timebox_types tt
        LEFT JOIN timebox_categories tc ON tt.categoria_id = tc.id
        ORDER BY tt.created_at DESC
      `;
      
      const types = await executeQuery(sql);
      
      res.json({
        status: true,
        message: 'Tipos de timebox obtenidos exitosamente',
        data: types
      });
    } catch (error) {
      console.error('Error al obtener tipos de timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener tipo de timebox por ID
  static async getTimeboxTypeById(req, res) {
    try {
      const { id } = req.params;
      
      const sql = `
        SELECT tt.*, tc.nombre as categoria_nombre
        FROM timebox_types tt
        LEFT JOIN timebox_categories tc ON tt.categoria_id = tc.id
        WHERE tt.id = ?
      `;
      
      const [type] = await executeQuery(sql, [id]);
      
      if (!type) {
        return res.status(404).json({
          status: false,
          message: 'Tipo de timebox no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Tipo de timebox obtenido exitosamente',
        data: type
      });
    } catch (error) {
      console.error('Error al obtener tipo de timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Crear nuevo tipo de timebox
  static async createTimeboxType(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { nombre, definicion, categoria_id, entregablesComunes, evidenciasCierre } = req.body;
      const id = uuidv4();
      
      const sql = `
        INSERT INTO timebox_types (id, nombre, definicion, categoria_id, entregables_comunes, evidencias_cierre)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await executeQuery(sql, [
        id, 
        nombre, 
        definicion, 
        categoria_id, 
        entregablesComunes ? JSON.stringify(entregablesComunes) : null,
        evidenciasCierre ? JSON.stringify(evidenciasCierre) : null
      ]);
      
      // Obtener el tipo creado
      const [newType] = await executeQuery(`
        SELECT tt.*, tc.nombre as categoria_nombre
        FROM timebox_types tt
        LEFT JOIN timebox_categories tc ON tt.categoria_id = tc.id
        WHERE tt.id = ?
      `, [id]);
      
      res.status(201).json({
        status: true,
        message: 'Tipo de timebox creado exitosamente',
        data: newType
      });
    } catch (error) {
      console.error('Error al crear tipo de timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar tipo de timebox
  static async updateTimeboxType(req, res) {
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

      const { nombre, definicion, categoria_id, entregablesComunes, evidenciasCierre } = req.body;
      
      // Verificar que el tipo existe
      const [existingType] = await executeQuery('SELECT * FROM timebox_types WHERE id = ?', [id]);
      if (!existingType) {
        return res.status(404).json({
          status: false,
          message: 'Tipo de timebox no encontrado'
        });
      }

      const sql = `
        UPDATE timebox_types 
        SET nombre = ?, definicion = ?, categoria_id = ?, 
            entregables_comunes = ?, evidencias_cierre = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await executeQuery(sql, [
        nombre, 
        definicion, 
        categoria_id, 
        entregablesComunes ? JSON.stringify(entregablesComunes) : null,
        evidenciasCierre ? JSON.stringify(evidenciasCierre) : null,
        id
      ]);
      
      // Obtener el tipo actualizado
      const [updatedType] = await executeQuery(`
        SELECT tt.*, tc.nombre as categoria_nombre
        FROM timebox_types tt
        LEFT JOIN timebox_categories tc ON tt.categoria_id = tc.id
        WHERE tt.id = ?
      `, [id]);

      res.json({
        status: true,
        message: 'Tipo de timebox actualizado exitosamente',
        data: updatedType
      });
    } catch (error) {
      console.error('Error al actualizar tipo de timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar tipo de timebox
  static async deleteTimeboxType(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el tipo existe
      const [existingType] = await executeQuery('SELECT * FROM timebox_types WHERE id = ?', [id]);
      if (!existingType) {
        return res.status(404).json({
          status: false,
          message: 'Tipo de timebox no encontrado'
        });
      }

      // Verificar que no hay timeboxes usando este tipo
      const [timeboxesUsingType] = await executeQuery('SELECT COUNT(*) as count FROM timeboxes WHERE tipo_timebox_id = ?', [id]);
      if (timeboxesUsingType.count > 0) {
        return res.status(400).json({
          status: false,
          message: 'No se puede eliminar el tipo de timebox porque está siendo usado por timeboxes existentes'
        });
      }

      const sql = 'DELETE FROM timebox_types WHERE id = ?';
      await executeQuery(sql, [id]);
      
      res.json({
        status: true,
        message: 'Tipo de timebox eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar tipo de timebox:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // ===== CRUD PARA CATEGORÍAS =====
  
  // Obtener todas las categorías de timebox
  static async getAllTimeboxCategories(req, res) {
    try {
      const sql = 'SELECT * FROM timebox_categories ORDER BY created_at DESC';
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
  static async createTimeboxCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { nombre, descripcion } = req.body;
      const id = uuidv4();
      
      const sql = 'INSERT INTO timebox_categories (id, nombre, descripcion) VALUES (?, ?, ?)';
      await executeQuery(sql, [id, nombre, descripcion || null]);
      
      // Obtener la categoría creada
      const [newCategory] = await executeQuery('SELECT * FROM timebox_categories WHERE id = ?', [id]);
      
      res.status(201).json({
        status: true,
        message: 'Categoría creada exitosamente',
        data: newCategory
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

  // Actualizar categoría
  static async updateTimeboxCategory(req, res) {
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

      const { nombre, descripcion } = req.body;
      
      // Verificar que la categoría existe
      const [existingCategory] = await executeQuery('SELECT * FROM timebox_categories WHERE id = ?', [id]);
      if (!existingCategory) {
        return res.status(404).json({
          status: false,
          message: 'Categoría no encontrada'
        });
      }

      const sql = 'UPDATE timebox_categories SET nombre = ?, descripcion = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(sql, [nombre, descripcion || null, id]);
      
      // Obtener la categoría actualizada
      const [updatedCategory] = await executeQuery('SELECT * FROM timebox_categories WHERE id = ?', [id]);

      res.json({
        status: true,
        message: 'Categoría actualizada exitosamente',
        data: updatedCategory
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
  static async deleteTimeboxCategory(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que la categoría existe
      const [existingCategory] = await executeQuery('SELECT * FROM timebox_categories WHERE id = ?', [id]);
      if (!existingCategory) {
        return res.status(404).json({
          status: false,
          message: 'Categoría no encontrada'
        });
      }

      // Verificar que no hay tipos de timebox usando esta categoría
      const [typesUsingCategory] = await executeQuery('SELECT COUNT(*) as count FROM timebox_types WHERE categoria_id = ?', [id]);
      if (typesUsingCategory.count > 0) {
        return res.status(400).json({
          status: false,
          message: 'No se puede eliminar la categoría porque está siendo usada por tipos de timebox existentes'
        });
      }

      const sql = 'DELETE FROM timebox_categories WHERE id = ?';
      await executeQuery(sql, [id]);
      
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
}

module.exports = TimeboxController;