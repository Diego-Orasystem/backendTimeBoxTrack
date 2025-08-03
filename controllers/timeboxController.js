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

      const { tipoTimeboxId, projectId, businessAnalystId, monto, estado, fases, entrega, publicacionOferta } = req.body;
      const id = uuidv4();
      
      const sql = `
        INSERT INTO timeboxes (id, tipo_timebox_id, business_analyst_id, project_id, monto, estado)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await executeQuery(sql, [id, tipoTimeboxId, businessAnalystId || null, projectId, monto || null, estado || 'En Definicion']);

      // Guardar las fases si existen
      if (fases) {
        await TimeboxController.savePhasesToDatabase(id, fases);
      }
      
      // Obtener el timebox creado con sus fases
      const [newTimebox] = await executeQuery(`
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        WHERE t.id = ?
      `, [id]);

      // Cargar las fases del timebox
      const loadedFases = await TimeboxController.loadPhasesFromDatabase(id);
      newTimebox.fases = loadedFases;
      
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
      const { id, timeboxId } = req.params;
      const timeboxIdToUse = timeboxId || id; // Usar timeboxId si existe, sino usar id
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { tipoTimeboxId, projectId, businessAnalystId, monto, estado, fases, entrega, publicacionOferta } = req.body;
      
      // Verificar que el timebox existe
      const [existingTimebox] = await executeQuery('SELECT * FROM timeboxes WHERE id = ?', [timeboxIdToUse]);
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
      values.push(timeboxIdToUse);
      
      const sql = `UPDATE timeboxes SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(sql, values);

      // Actualizar las fases si existen
      if (fases) {
        await TimeboxController.savePhasesToDatabase(timeboxIdToUse, fases);
      }

      // Actualizar publicación de oferta y postulaciones si existen
      if (publicacionOferta) {
        await TimeboxController.savePublicacionOfertaToDatabase(timeboxIdToUse, publicacionOferta);
      }
      
      // Obtener el timebox actualizado con sus fases
      const [updatedTimebox] = await executeQuery(`
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        WHERE t.id = ?
      `, [timeboxIdToUse]);

      // Cargar las fases del timebox
      const loadedFases = await TimeboxController.loadPhasesFromDatabase(timeboxIdToUse);
      updatedTimebox.fases = loadedFases;

      // Cargar publicación de oferta y postulaciones
      const loadedPublicacionOferta = await TimeboxController.loadPublicacionOfertaFromDatabase(timeboxIdToUse);
      updatedTimebox.publicacionOferta = loadedPublicacionOferta;

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

  // Obtener timeboxes publicados (estado "Disponible")
  static async getPublishedTimeboxes(req, res) {
    try {
      const sql = `
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        WHERE t.estado = 'Disponible'
        ORDER BY t.created_at DESC
      `;
      
      const timeboxes = await executeQuery(sql);
      
      // Cargar las fases y publicación de oferta para cada timebox
      for (let timebox of timeboxes) {
        const fases = await TimeboxController.loadPhasesFromDatabase(timebox.id);
        timebox.fases = fases;
        
        const publicacionOferta = await TimeboxController.loadPublicacionOfertaFromDatabase(timebox.id);
        timebox.publicacionOferta = publicacionOferta;
      }
      
      res.json({
        status: true,
        message: 'Timeboxes publicados obtenidos exitosamente',
        data: timeboxes
      });
    } catch (error) {
      console.error('Error al obtener timeboxes publicados:', error);
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
      
      // Cargar las fases para cada timebox
      for (let timebox of timeboxes) {
        timebox.fases = await TimeboxController.loadPhasesFromDatabase(timebox.id);
      }
      
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
      
      // Convertir BigInt a Number para evitar errores de serialización
      const processedStats = {
        total: Number(stats.total),
        en_definicion: Number(stats.en_definicion),
        disponible: Number(stats.disponible),
        en_ejecucion: Number(stats.en_ejecucion),
        finalizado: Number(stats.finalizado)
      };
      
      res.json({
        status: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: processedStats
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
      
      // Cargar fases y publicación de oferta para cada timebox
      const processedTimeboxes = [];
      for (let timebox of timeboxes) {
        // Cargar las fases del timebox
        const fases = await TimeboxController.loadPhasesFromDatabase(timebox.id);
        
        // Cargar publicación de oferta y postulaciones
        const publicacionOferta = await TimeboxController.loadPublicacionOfertaFromDatabase(timebox.id);
        
        processedTimeboxes.push({
          ...timebox,
          num_postulaciones: Number(timebox.num_postulaciones),
          fases: fases,
          publicacionOferta: publicacionOferta
        });
      }
      
      res.json({
        status: true,
        message: 'Timeboxes con postulaciones obtenidos exitosamente',
        data: processedTimeboxes
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
      if (Number(timeboxesUsingType.count) > 0) {
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
      if (Number(typesUsingCategory.count) > 0) {
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

  // Método auxiliar para convertir fecha ISO a formato DATE de MySQL
  static formatDateForMySQL(dateValue) {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0]; // Obtiene solo YYYY-MM-DD
    } catch (error) {
      console.error('Error convirtiendo fecha:', error);
      return null;
    }
  }

  // Método auxiliar para guardar las fases en la base de datos
  static async savePhasesToDatabase(timeboxId, fases) {
    try {
      // Guardar fase de planning
      if (fases.planning) {
        const planning = fases.planning;
        const planningId = planning.id || uuidv4();
        
        await executeQuery(`
          INSERT INTO planning_phases (id, timebox_id, nombre, codigo, descripcion, fecha_fase, eje, aplicativo, alcance, esfuerzo, fecha_inicio, team_leader_id, completada)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre), codigo = VALUES(codigo), descripcion = VALUES(descripcion),
          fecha_fase = VALUES(fecha_fase), eje = VALUES(eje), aplicativo = VALUES(aplicativo),
          alcance = VALUES(alcance), esfuerzo = VALUES(esfuerzo), fecha_inicio = VALUES(fecha_inicio),
          team_leader_id = VALUES(team_leader_id), completada = VALUES(completada), updated_at = CURRENT_TIMESTAMP
        `, [
          planningId,
          timeboxId,
          planning.nombre || '',
          planning.codigo || '',
          planning.descripcion || null,
          TimeboxController.formatDateForMySQL(planning.fechaFase || planning.fecha_fase),
          planning.eje || null,
          planning.aplicativo || null,
          planning.alcance || null,
          planning.esfuerzo || null,
          TimeboxController.formatDateForMySQL(planning.fechaInicio || planning.fecha_inicio),
          planning.teamLeader?.id || planning.team_leader_id || null,
          planning.completada || false
        ]);

        // Guardar adjuntos de planning si existen
        if (planning.adjuntos && Array.isArray(planning.adjuntos)) {
          await TimeboxController.saveAdjuntosForPhase(planningId, planning.adjuntos, 'planning');
        }
      }

      // Guardar fase de kickoff
      if (fases.kickOff) {
        const kickoff = fases.kickOff;
        const kickoffId = kickoff.id || uuidv4();
        
        await executeQuery(`
          INSERT INTO kickoff_phases (id, timebox_id, fecha_fase, completada, team_movilization, participantes, lista_acuerdos)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          fecha_fase = VALUES(fecha_fase),
          completada = VALUES(completada),
          team_movilization = VALUES(team_movilization),
          participantes = VALUES(participantes),
          lista_acuerdos = VALUES(lista_acuerdos),
          updated_at = CURRENT_TIMESTAMP
        `, [
          kickoffId,
          timeboxId,
          TimeboxController.formatDateForMySQL(kickoff.fechaFase || kickoff.fecha_fase),
          kickoff.completada || false,
          kickoff.teamMovilization ? JSON.stringify(kickoff.teamMovilization) : null,
          kickoff.participantes ? JSON.stringify(kickoff.participantes) : null,
          kickoff.listaAcuerdos ? JSON.stringify(kickoff.listaAcuerdos) : null
        ]);
      }

      // Guardar fase de refinement
      if (fases.refinement) {
        const refinement = fases.refinement;
        const refinementId = refinement.id || uuidv4();
        
        await executeQuery(`
          INSERT INTO refinement_phases (id, timebox_id, fecha_fase, completada, revisiones)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          fecha_fase = VALUES(fecha_fase),
          completada = VALUES(completada),
          revisiones = VALUES(revisiones),
          updated_at = CURRENT_TIMESTAMP
        `, [
          refinementId,
          timeboxId,
          TimeboxController.formatDateForMySQL(refinement.fechaFase || refinement.fecha_fase),
          refinement.completada || false,
          refinement.revisiones ? JSON.stringify(refinement.revisiones) : null
        ]);
      }

      // Guardar fase de qa
      if (fases.qa) {
        const qa = fases.qa;
        const qaId = qa.id || uuidv4();
        
        await executeQuery(`
          INSERT INTO qa_phases (
            id, timebox_id, fecha_fase, completada, estado_consolidacion, progreso_consolidacion,
            fecha_preparacion_entorno, entorno_pruebas, version_despliegue, responsable_despliegue,
            observaciones_despliegue, plan_pruebas_url, resultados_pruebas, bugs_identificados,
            url_bugs, responsable_qa, fecha_inicio_uat, fecha_fin_uat, estado_uat,
            responsable_uat, feedback_uat
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          fecha_fase = VALUES(fecha_fase),
          completada = VALUES(completada),
          estado_consolidacion = VALUES(estado_consolidacion),
          progreso_consolidacion = VALUES(progreso_consolidacion),
          fecha_preparacion_entorno = VALUES(fecha_preparacion_entorno),
          entorno_pruebas = VALUES(entorno_pruebas),
          version_despliegue = VALUES(version_despliegue),
          responsable_despliegue = VALUES(responsable_despliegue),
          observaciones_despliegue = VALUES(observaciones_despliegue),
          plan_pruebas_url = VALUES(plan_pruebas_url),
          resultados_pruebas = VALUES(resultados_pruebas),
          bugs_identificados = VALUES(bugs_identificados),
          url_bugs = VALUES(url_bugs),
          responsable_qa = VALUES(responsable_qa),
          fecha_inicio_uat = VALUES(fecha_inicio_uat),
          fecha_fin_uat = VALUES(fecha_fin_uat),
          estado_uat = VALUES(estado_uat),
          responsable_uat = VALUES(responsable_uat),
          feedback_uat = VALUES(feedback_uat),
          updated_at = CURRENT_TIMESTAMP
        `, [
          qaId,
          timeboxId,
          TimeboxController.formatDateForMySQL(qa.fechaFase || qa.fecha_fase),
          qa.completada || false,
          qa.estadoConsolidacion || 'Pendiente',
          qa.progresoConsolidacion || 0,
          TimeboxController.formatDateForMySQL(qa.fechaPreparacionEntorno),
          qa.entornoPruebas || null,
          qa.versionDespliegue || null,
          qa.responsableDespliegue || null,
          qa.observacionesDespliegue || null,
          qa.planPruebasUrl || null,
          qa.resultadosPruebas || null,
          qa.bugsIdentificados || null,
          qa.urlBugs || null,
          qa.responsableQa || null,
          TimeboxController.formatDateForMySQL(qa.fechaInicioUat),
          TimeboxController.formatDateForMySQL(qa.fechaFinUat),
          qa.estadoUat || 'Pendiente',
          qa.responsableUat || null,
          qa.feedbackUat || null
        ]);
      }

      // Guardar fase de close
      if (fases.close) {
        const close = fases.close;
        const closeId = close.id || uuidv4();
        
        await executeQuery(`
          INSERT INTO close_phases (
            id, timebox_id, fecha_fase, completada, checklist, adjuntos, cumplimiento,
            observaciones, aprobador, ev_madurez_aplicativo, mejoras
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          fecha_fase = VALUES(fecha_fase),
          completada = VALUES(completada),
          checklist = VALUES(checklist),
          adjuntos = VALUES(adjuntos),
          cumplimiento = VALUES(cumplimiento),
          observaciones = VALUES(observaciones),
          aprobador = VALUES(aprobador),
          ev_madurez_aplicativo = VALUES(ev_madurez_aplicativo),
          mejoras = VALUES(mejoras),
          updated_at = CURRENT_TIMESTAMP
        `, [
          closeId,
          timeboxId,
          TimeboxController.formatDateForMySQL(close.fechaFase || close.fecha_fase),
          close.completada || false,
          close.checklist ? JSON.stringify(close.checklist) : null,
          close.adjuntos ? JSON.stringify(close.adjuntos) : null,
          close.cumplimiento || 'Total',
          close.observaciones || null,
          close.aprobador || null,
          close.evMadurezAplicativo || null,
          close.mejoras ? JSON.stringify(close.mejoras) : null
        ]);
      }
      
    } catch (error) {
      console.error('Error guardando fases:', error);
      throw error;
    }
  }

  // Método auxiliar para cargar las fases desde la base de datos
  static async loadPhasesFromDatabase(timeboxId) {
    try {
      const fases = {};

      // Cargar planning
      const planning = await executeQuery(`
        SELECT pp.*, p.nombre as team_leader_nombre
        FROM planning_phases pp
        LEFT JOIN personas p ON pp.team_leader_id = p.id
        WHERE pp.timebox_id = ?
      `, [timeboxId]);

      if (planning.length > 0) {
        const p = planning[0];
        
        // Cargar adjuntos de planning
        const adjuntos = await TimeboxController.loadAdjuntosForPhase(p.id, 'planning');
        
        fases.planning = {
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          descripcion: p.descripcion,
          fechaFase: p.fecha_fase,
          eje: p.eje,
          aplicativo: p.aplicativo,
          alcance: p.alcance,
          esfuerzo: p.esfuerzo,
          fechaInicio: p.fecha_inicio,
          teamLeader: p.team_leader_id ? {
            id: p.team_leader_id,
            nombre: p.team_leader_nombre
          } : null,
          completada: p.completada,
          adjuntos: adjuntos
        };
      }

      // Cargar kickoff
      const kickoff = await executeQuery(`
        SELECT * FROM kickoff_phases WHERE timebox_id = ?
      `, [timeboxId]);

      if (kickoff.length > 0) {
        const k = kickoff[0];
        fases.kickOff = {
          id: k.id,
          fechaFase: k.fecha_fase,
          completada: k.completada,
          teamMovilization: k.team_movilization || undefined,
          participantes: k.participantes || undefined,
          listaAcuerdos: k.lista_acuerdos || undefined
        };
      }

      // Cargar refinement
      const refinement = await executeQuery(`
        SELECT * FROM refinement_phases WHERE timebox_id = ?
      `, [timeboxId]);

      if (refinement.length > 0) {
        const r = refinement[0];
        fases.refinement = {
          id: r.id,
          fechaFase: r.fecha_fase,
          completada: r.completada,
          revisiones: r.revisiones || undefined
        };
      }

      // Cargar qa
      const qa = await executeQuery(`
        SELECT * FROM qa_phases WHERE timebox_id = ?
      `, [timeboxId]);

      if (qa.length > 0) {
        const q = qa[0];
        fases.qa = {
          id: q.id,
          fechaFase: q.fecha_fase,
          completada: q.completada,
          estadoConsolidacion: q.estado_consolidacion,
          progresoConsolidacion: q.progreso_consolidacion,
          fechaPreparacionEntorno: q.fecha_preparacion_entorno,
          entornoPruebas: q.entorno_pruebas,
          versionDespliegue: q.version_despliegue,
          responsableDespliegue: q.responsable_despliegue,
          observacionesDespliegue: q.observaciones_despliegue,
          planPruebasUrl: q.plan_pruebas_url,
          resultadosPruebas: q.resultados_pruebas,
          bugsIdentificados: q.bugs_identificados,
          urlBugs: q.url_bugs,
          responsableQa: q.responsable_qa,
          fechaInicioUat: q.fecha_inicio_uat,
          fechaFinUat: q.fecha_fin_uat,
          estadoUat: q.estado_uat,
          responsableUat: q.responsable_uat,
          feedbackUat: q.feedback_uat
        };
      }

      // Cargar close
      const close = await executeQuery(`
        SELECT * FROM close_phases WHERE timebox_id = ?
      `, [timeboxId]);

      if (close.length > 0) {
        const c = close[0];
        fases.close = {
          id: c.id,
          fechaFase: c.fecha_fase,
          completada: c.completada,
          checklist: c.checklist || undefined,
          adjuntos: c.adjuntos || undefined,
          cumplimiento: c.cumplimiento,
          observaciones: c.observaciones,
          aprobador: c.aprobador,
          evMadurezAplicativo: c.ev_madurez_aplicativo,
          mejoras: c.mejoras || undefined
        };
      }
      
      return fases;
    } catch (error) {
      console.error('Error cargando fases:', error);
      return {};
    }
  }

  // Método auxiliar para guardar adjuntos de una fase
  static async saveAdjuntosForPhase(phaseId, adjuntos, phaseType) {
    try {
      for (const adjunto of adjuntos) {
        if (adjunto.adjuntoId) {
          // Crear la relación en la tabla correspondiente
          const relationTable = `${phaseType}_adjuntos`;
          const phaseColumn = `${phaseType}_id`;
          
          await executeQuery(`
            INSERT INTO ${relationTable} (${phaseColumn}, adjunto_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE ${phaseColumn} = VALUES(${phaseColumn})
          `, [phaseId, adjunto.adjuntoId]);
        }
      }
    } catch (error) {
      console.error(`Error guardando adjuntos para fase ${phaseType}:`, error);
      throw error;
    }
  }

  // Método auxiliar para cargar adjuntos de una fase
  static async loadAdjuntosForPhase(phaseId, phaseType) {
    try {
      const relationTable = `${phaseType}_adjuntos`;
      const phaseColumn = `${phaseType}_id`;
      
      const adjuntos = await executeQuery(`
        SELECT a.* FROM adjuntos a
        JOIN ${relationTable} pa ON a.id = pa.adjunto_id
        WHERE pa.${phaseColumn} = ?
        ORDER BY a.created_at
      `, [phaseId]);
      
      return adjuntos.map(adj => ({
        id: adj.id,
        nombre: adj.nombre,
        url: adj.url,
        tipo: adj.tipo,
        adjuntoId: adj.id
      }));
    } catch (error) {
      console.error(`Error cargando adjuntos para fase ${phaseType}:`, error);
      return [];
    }
  }

  // Guardar publicación de oferta y postulaciones en la base de datos
  static async savePublicacionOfertaToDatabase(timeboxId, publicacionOferta) {
    try {
      const publicacionId = publicacionOferta.id || uuidv4();
      
      // Guardar o actualizar publicación de oferta
      await executeQuery(`
        INSERT INTO publicacion_ofertas (
          id, timebox_id, solicitado, publicado, fecha_publicacion
        )
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        solicitado = VALUES(solicitado),
        publicado = VALUES(publicado),
        fecha_publicacion = VALUES(fecha_publicacion),
        updated_at = CURRENT_TIMESTAMP
      `, [
        publicacionId,
        timeboxId,
        publicacionOferta.solicitado || false,
        publicacionOferta.publicado || false,
        TimeboxController.formatDateForMySQL(publicacionOferta.fechaPublicacion)
      ]);

      // Guardar postulaciones si existen
      if (publicacionOferta.postulaciones && publicacionOferta.postulaciones.length > 0) {
        for (const postulacion of publicacionOferta.postulaciones) {
          const postulacionId = postulacion.id || uuidv4();
          
          await executeQuery(`
            INSERT INTO postulaciones (
              id, publicacion_id, rol, desarrollador, fecha_postulacion, 
              estado_solicitud, asignado, fecha_asignacion
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            rol = VALUES(rol),
            desarrollador = VALUES(desarrollador),
            fecha_postulacion = VALUES(fecha_postulacion),
            estado_solicitud = VALUES(estado_solicitud),
            asignado = VALUES(asignado),
            fecha_asignacion = VALUES(fecha_asignacion),
            updated_at = CURRENT_TIMESTAMP
          `, [
            postulacionId,
            publicacionId,
            postulacion.rol,
            postulacion.desarrollador,
            TimeboxController.formatDateForMySQL(postulacion.fechaPostulacion),
            postulacion.estadoSolicitud || 'Pendiente',
            postulacion.asignacion?.asignado || false,
            TimeboxController.formatDateForMySQL(postulacion.asignacion?.fechaAsignacion)
          ]);
        }
      }
      
    } catch (error) {
      console.error('Error guardando publicación de oferta:', error);
      throw error;
    }
  }

  // Cargar publicación de oferta y postulaciones desde la base de datos
  static async loadPublicacionOfertaFromDatabase(timeboxId) {
    try {
      // Cargar publicación de oferta
      const publicacionOferta = await executeQuery(`
        SELECT * FROM publicacion_ofertas WHERE timebox_id = ?
      `, [timeboxId]);

      if (publicacionOferta.length === 0) {
        return undefined;
      }

      const po = publicacionOferta[0];
      const publicacionData = {
        id: po.id,
        solicitado: po.solicitado,
        publicado: po.publicado,
        fechaPublicacion: po.fecha_publicacion,
        postulaciones: []
      };

      // Cargar postulaciones relacionadas
      const postulaciones = await executeQuery(`
        SELECT * FROM postulaciones WHERE publicacion_id = ?
      `, [po.id]);

      publicacionData.postulaciones = postulaciones.map(p => ({
        id: p.id,
        rol: p.rol,
        desarrollador: p.desarrollador,
        fechaPostulacion: p.fecha_postulacion,
        estadoSolicitud: p.estado_solicitud,
        asignacion: {
          asignado: p.asignado,
          fechaAsignacion: p.fecha_asignacion
        }
      }));

      return publicacionData;
      
    } catch (error) {
      console.error('Error cargando publicación de oferta:', error);
      return undefined;
    }
  }
}

module.exports = TimeboxController;