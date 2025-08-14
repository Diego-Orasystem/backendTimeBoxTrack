const { validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class TimeboxController {
  constructor() {
    // Constructor vacío
  }
  // Obtener todos los timeboxes
  async getAllTimeboxes(req, res) {
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
  async getTimeboxById(req, res) {
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
      // Cargar fases y publicación de oferta para este timebox
      console.log('Cargando datos para timebox (byId):', timebox.id);
      const fases = await this.loadPhasesFromDatabase(timebox.id);
      const publicacionOferta = await this.loadPublicacionOfertaFromDatabase(timebox.id);

      const response = {
        id: timebox.id,
        tipo_timebox_id: timebox.tipo_timebox_id,
        business_analyst_id: timebox.business_analyst_id,
        project_id: timebox.project_id,
        monto: timebox.monto,
        estado: timebox.estado,
        created_at: timebox.created_at,
        updated_at: timebox.updated_at,
        tipo_nombre: timebox.tipo_nombre,
        proyecto_nombre: timebox.proyecto_nombre,
        business_analyst_nombre: timebox.business_analyst_nombre,
        fases,
        publicacionOferta
      };

      return res.json({
        status: true,
        message: 'Timebox obtenido exitosamente',
        data: response
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
  async getTimeboxWithFases(req, res) {
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
  async createTimebox(req, res) {
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
        await this.savePhasesToDatabase(id, fases);
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
      const loadedFases = await this.loadPhasesFromDatabase(id);
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
  async updateTimebox(req, res) {
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
      
      // Debug: verificar qué está recibiendo el backend
      console.log('🔍 Backend updateTimebox - body completo:', req.body);
      console.log('🔍 Backend updateTimebox - fases recibidas:', fases);
      console.log('🔍 Backend updateTimebox - planning recibido:', fases?.planning);
      console.log('🔍 Backend updateTimebox - teamLeader recibido:', fases?.planning?.teamLeader);
      
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
        await this.savePhasesToDatabase(timeboxIdToUse, fases);
        
        // Lógica de avance de fases
        if (fases.planning && fases.planning.completada) {
          console.log('Fase planning completada, verificando avance a kickoff');
          
          // Verificar si ya existe la fase kickoff
          const [existingKickoff] = await executeQuery('SELECT * FROM kickoff_phases WHERE timebox_id = ?', [timeboxIdToUse]);
          
          if (!existingKickoff) {
            console.log('Creando fase kickoff automáticamente');
            const kickoffId = uuidv4();
            await executeQuery(`
              INSERT INTO kickoff_phases (id, timebox_id, created_at, updated_at)
              VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [kickoffId, timeboxIdToUse]);
          }
          
          // Cambiar estado a "En Ejecucion" si aún no lo está (cubriendo Disponible/Definición/otros)
          if (existingTimebox.estado !== 'En Ejecucion') {
            console.log('Cambiando estado a En Ejecucion (desde: ' + existingTimebox.estado + ')');
            await executeQuery(`
              UPDATE timeboxes 
              SET estado = 'En Ejecucion', updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `, [timeboxIdToUse]);
          }
        }
      }

      // Actualizar publicación de oferta y postulaciones si existen
      if (publicacionOferta) {
        await this.savePublicacionOfertaToDatabase(timeboxIdToUse, publicacionOferta);
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
      const loadedFases = await this.loadPhasesFromDatabase(timeboxIdToUse);
      updatedTimebox.fases = loadedFases;

      // Cargar publicación de oferta y postulaciones
      const loadedPublicacionOferta = await this.loadPublicacionOfertaFromDatabase(timeboxIdToUse);
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

  // Obtener timeboxes publicados (según publicacion_ofertas.publicado = 1)
  async getPublishedTimeboxes(req, res) {
    try {
      console.log('🔍 DEBUG - Iniciando getPublishedTimeboxes');
      
      // Debug: Verificar si TEST1108 existe en publicacion_ofertas
      const [publicacionTest1108] = await executeQuery(
        'SELECT * FROM publicacion_ofertas WHERE timebox_id = ?', 
        ['92d624d5-b7dd-4476-8530-cc07cdb97e1b'] // ID de TEST1108
      );
      console.log('🔍 DEBUG - Publicacion TEST1108 en BD:', publicacionTest1108);
      
      const sql = `
        SELECT t.*, tt.nombre as tipo_nombre, p.nombre as proyecto_nombre, 
               per.nombre as business_analyst_nombre
        FROM timeboxes t
        LEFT JOIN timebox_types tt ON t.tipo_timebox_id = tt.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN personas per ON t.business_analyst_id = per.id
        INNER JOIN publicacion_ofertas po ON po.timebox_id = t.id AND po.publicado = 1
        ORDER BY COALESCE(po.fecha_publicacion, t.created_at) DESC
      `;
      
      console.log('🔍 DEBUG - SQL Query:', sql);
      
      const timeboxes = await executeQuery(sql);
      console.log('🔍 DEBUG - Timeboxes encontrados en SQL:', timeboxes.length);
      console.log('🔍 DEBUG - IDs de timeboxes encontrados:', timeboxes.map(t => t.id));
      
      // Debug: Verificar si TEST1108 está en los resultados
      const test1108 = timeboxes.find(t => t.fases?.planning?.codigo === 'TEST1108');
      if (test1108) {
        console.log('🔍 DEBUG - TEST1108 encontrado en SQL results');
      } else {
        console.log('🔍 DEBUG - TEST1108 NO encontrado en SQL results');
      }
      
      // Cargar las fases y publicación de oferta para cada timebox
      for (let timebox of timeboxes) {
        const fases = await this.loadPhasesFromDatabase(timebox.id);
        timebox.fases = fases;
        
        const publicacionOferta = await this.loadPublicacionOfertaFromDatabase(timebox.id);
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
  async updateTimeboxEstado(req, res) {
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
  async deleteTimebox(req, res) {
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
  async getTimeboxesByProject(req, res) {
    try {
      const { projectId } = req.params;
      console.log('Buscando timeboxes para proyecto:', projectId);
      
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
      console.log('Timeboxes encontrados:', timeboxes.map(t => ({ id: t.id, estado: t.estado })));
      
      // Cargar las fases y publicación de oferta para cada timebox
      for (let timebox of timeboxes) {
        console.log('Cargando datos para timebox:', timebox.id);
        
        // Cargar fases
        timebox.fases = await this.loadPhasesFromDatabase(timebox.id);
        console.log('Fases cargadas:', Object.keys(timebox.fases));
        
        // Cargar publicación de oferta
        timebox.publicacionOferta = await this.loadPublicacionOfertaFromDatabase(timebox.id);
        console.log('Publicación de oferta:', timebox.publicacionOferta);
        
        // Log detallado de la fase planning
        if (timebox.fases.planning) {
          console.log('Planning phase details being sent:', {
            id: timebox.fases.planning.id,
            teamLeader: timebox.fases.planning.teamLeader,
            skills: timebox.fases.planning.skills,
            completada: timebox.fases.planning.completada
          });
        }
      }
      
      console.log('Final response structure:', timeboxes.map(t => ({
        id: t.id,
        estado: t.estado,
        hasPlanning: !!t.fases.planning,
        planningTeamLeader: t.fases.planning?.teamLeader,
        planningSkills: t.fases.planning?.skills,
        planningCompletada: t.fases.planning?.completada
      })));
      
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
  async getTimeboxStats(req, res) {
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
  async getTimeboxesWithPostulations(req, res) {
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
        const fases = await this.loadPhasesFromDatabase(timebox.id);
        
        // Cargar publicación de oferta y postulaciones
        const publicacionOferta = await this.loadPublicacionOfertaFromDatabase(timebox.id);
        
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
  async getAllTimeboxTypes(req, res) {
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
  async getTimeboxTypeById(req, res) {
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
  async createTimeboxType(req, res) {
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
  async updateTimeboxType(req, res) {
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
  async deleteTimeboxType(req, res) {
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
  async getAllTimeboxCategories(req, res) {
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
  async createTimeboxCategory(req, res) {
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
  async updateTimeboxCategory(req, res) {
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
  async deleteTimeboxCategory(req, res) {
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
  formatDateForMySQL(dateValue) {
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
  async savePhasesToDatabase(timeboxId, fases) {
    try {
      // Guardar fase de planning
      if (fases.planning) {
        const planning = fases.planning;
        console.log('🔍 Backend savePhasesToDatabase - planning recibido:', planning);
        console.log('🔍 Backend savePhasesToDatabase - teamLeader recibido:', planning.teamLeader);
        console.log('🔍 Backend savePhasesToDatabase - teamLeader.id:', planning.teamLeader?.id);
        console.log('🔍 Backend savePhasesToDatabase - teamLeader.nombre:', planning.teamLeader?.nombre);
        
        console.log('Planning phase data:', {
          id: planning.id,
          teamLeader: planning.teamLeader,
          team_leader_id: planning.team_leader_id,
          nombre: planning.nombre,
          codigo: planning.codigo,
          eje: planning.eje,
          aplicativo: planning.aplicativo,
          alcance: planning.alcance,
          esfuerzo: planning.esfuerzo,
          fechaInicio: planning.fechaInicio
        });
        
        const planningId = planning.id || uuidv4();
        
        // Determinar si la fase planning está completa
        const isPlanningComplete = planning.nombre && 
                                 planning.codigo && 
                                 planning.eje && 
                                 planning.aplicativo && 
                                 planning.alcance && 
                                 planning.esfuerzo && 
                                 planning.fechaInicio && 
                                 planning.teamLeader?.id;
        
        console.log('Planning completion check:', {
          nombre: !!planning.nombre,
          codigo: !!planning.codigo,
          eje: !!planning.eje,
          aplicativo: !!planning.aplicativo,
          alcance: !!planning.alcance,
          esfuerzo: !!planning.esfuerzo,
          fechaInicio: !!planning.fechaInicio,
          teamLeader: !!planning.teamLeader?.id,
          isComplete: isPlanningComplete
        });
        
        // Verificar si hay campos adicionales como skills
        const hasSkills = planning.skills && Array.isArray(planning.skills);
        console.log('Skills data:', {
          hasSkills,
          skills: planning.skills
        });
        
        // Preparar skills como JSON
        const skillsJson = planning.skills ? JSON.stringify(planning.skills) : null;
        console.log('Skills JSON to save:', skillsJson);
        // Preparar team leader completo como JSON (para preservar info adicional)
        const teamLeaderJson = planning.teamLeader ? JSON.stringify(planning.teamLeader) : null;
        console.log('TeamLeader JSON to save (planning):', teamLeaderJson);
        
        // Preparar cumplimiento (checklist) como JSON
        const cumplimientoJson = planning.cumplimiento ? JSON.stringify(planning.cumplimiento) : null;
        console.log('Cumplimiento JSON to save (planning):', cumplimientoJson);
        
        await executeQuery(`
          INSERT INTO planning_phases (id, timebox_id, nombre, codigo, descripcion, fecha_fase, eje, aplicativo, alcance, esfuerzo, fecha_inicio, team_leader_id, completada, skills, cumplimiento, team_leader_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre), codigo = VALUES(codigo), descripcion = VALUES(descripcion),
          fecha_fase = VALUES(fecha_fase), eje = VALUES(eje), aplicativo = VALUES(aplicativo),
          alcance = VALUES(alcance), esfuerzo = VALUES(esfuerzo), fecha_inicio = VALUES(fecha_inicio),
          team_leader_id = VALUES(team_leader_id), completada = VALUES(completada), skills = VALUES(skills), cumplimiento = VALUES(cumplimiento), team_leader_json = VALUES(team_leader_json), updated_at = CURRENT_TIMESTAMP
        `, [
          planningId,
          timeboxId,
          planning.nombre || '',
          planning.codigo || '',
          planning.descripcion || null,
          this.formatDateForMySQL(planning.fechaFase || planning.fecha_fase),
          planning.eje || null,
          planning.aplicativo || null,
          planning.alcance || null,
          planning.esfuerzo || null,
          this.formatDateForMySQL(planning.fechaInicio || planning.fecha_inicio),
          (() => {
            const teamLeaderId = planning.teamLeader?.id || planning.team_leader_id;
            console.log('Team Leader ID to save:', teamLeaderId);
            return teamLeaderId || null;
          })(),
          isPlanningComplete ? 1 : 0,
          skillsJson,
          cumplimientoJson,
          teamLeaderJson
        ]);
        
        // Si hay skills, guardarlos en una tabla separada o campo JSON
        if (hasSkills) {
          console.log('Guardando skills:', planning.skills);
          // Aquí podrías guardar skills en una tabla separada o en un campo JSON
          // Por ahora solo lo logueamos
        }

        // Guardar adjuntos de planning si existen
        if (planning.adjuntos && Array.isArray(planning.adjuntos)) {
          await this.saveAdjuntosForPhase(planningId, planning.adjuntos, 'planning');
        }
      }

      // Guardar fase de kickoff
      if (fases.kickOff) {
        const kickoff = fases.kickOff;
        const kickoffId = kickoff.id || uuidv4();
        
        console.log('🔍 Backend - kickoff recibido:', kickoff);
        console.log('🔍 Backend - kickoff.financiamiento:', kickoff.financiamiento);
        
        // Preparar compensación económica
        const compensacionEconomica = {
          skills: kickoff.compensacionEconomica?.skills || [],
          esfuerzoHH: kickoff.compensacionEconomica?.esfuerzoHH || 0,
          entregaAnticipada: {
            duracionEstimadaDias: kickoff.duracionEstimadaDias || 0,
            valorBase: kickoff.valorBase || 0,
            bonificaciones: kickoff.bonificaciones || []
          }
        };
        
        await executeQuery(`
          INSERT INTO kickoff_phases (id, timebox_id, fecha_fase, completada, team_movilization, participantes, lista_acuerdos, financiamiento, compensacion_economica)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          fecha_fase = VALUES(fecha_fase),
          completada = VALUES(completada),
          team_movilization = VALUES(team_movilization),
          participantes = VALUES(participantes),
          lista_acuerdos = VALUES(lista_acuerdos),
          financiamiento = VALUES(financiamiento),
          compensacion_economica = VALUES(compensacion_economica),
          updated_at = CURRENT_TIMESTAMP
        `, [
          kickoffId,
          timeboxId,
          this.formatDateForMySQL(kickoff.fechaFase || kickoff.fecha_fase),
          kickoff.completada || false,
          kickoff.teamMovilization ? JSON.stringify(kickoff.teamMovilization) : null,
          kickoff.participantes ? JSON.stringify(kickoff.participantes) : null,
          kickoff.listaAcuerdos ? JSON.stringify(kickoff.listaAcuerdos) : null,
          kickoff.financiamiento ? JSON.stringify(kickoff.financiamiento) : null,
          JSON.stringify(compensacionEconomica)
        ]);

        console.log('🔍 Backend - financiamiento guardado en DB:', kickoff.financiamiento ? JSON.stringify(kickoff.financiamiento) : null);

        // Guardar adjuntos de kickoff si existen
        if (kickoff.adjuntos && Array.isArray(kickoff.adjuntos)) {
          await this.saveAdjuntosForPhase(kickoffId, kickoff.adjuntos, 'kickoff');
        }
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
          this.formatDateForMySQL(refinement.fechaFase || refinement.fecha_fase),
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
          this.formatDateForMySQL(qa.fechaFase || qa.fecha_fase),
          qa.completada || false,
          qa.estadoConsolidacion || 'Pendiente',
          qa.progresoConsolidacion || 0,
          this.formatDateForMySQL(qa.fechaPreparacionEntorno),
          qa.entornoPruebas || null,
          qa.versionDespliegue || null,
          qa.responsableDespliegue || null,
          qa.observacionesDespliegue || null,
          qa.planPruebasUrl || null,
          qa.resultadosPruebas || null,
          qa.bugsIdentificados || null,
          qa.urlBugs || null,
          qa.responsableQa || null,
          this.formatDateForMySQL(qa.fechaInicioUat),
          this.formatDateForMySQL(qa.fechaFinUat),
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
          this.formatDateForMySQL(close.fechaFase || close.fecha_fase),
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
  async loadPhasesFromDatabase(timeboxId) {
    try {
      const fases = {};

      // Cargar planning
      console.log('Cargando planning para timebox:', timeboxId);
      const planning = await executeQuery(`
        SELECT pp.*, p.nombre as team_leader_nombre
        FROM planning_phases pp
        LEFT JOIN personas p ON pp.team_leader_id = p.id
        WHERE pp.timebox_id = ?
        ORDER BY pp.updated_at DESC, pp.created_at DESC
      `, [timeboxId]);
      
      console.log('Planning data from DB:', planning);

      if (planning.length > 0) {
        // Tomar el registro más reciente o el que tenga team_leader_id
        let p = planning[0];
        
        // Si hay múltiples registros, buscar el que tenga team_leader_id
        if (planning.length > 1) {
          const completePlanning = planning.find(pp => pp.team_leader_id);
          if (completePlanning) {
            p = completePlanning;
            console.log('Usando planning completo:', p.id);
          } else {
            console.log('Usando planning más reciente:', p.id);
          }
        }
        
        // Cargar adjuntos de planning
        const adjuntos = await this.loadAdjuntosForPhase(p.id, 'planning');
        
        const planningPhase = {
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
          teamLeader: (() => {
            console.log('Team Leader data from DB:', {
            id: p.team_leader_id,
            nombre: p.team_leader_nombre
            });
            // Si existe JSON con info completa, usarlo; si no, armar objeto básico
            try {
              if (p.team_leader_json) {
                const parsedLeader = typeof p.team_leader_json === 'string' ? JSON.parse(p.team_leader_json) : p.team_leader_json;
                // Asegurar que id y nombre estén presentes
                if (!parsedLeader.id && p.team_leader_id) parsedLeader.id = p.team_leader_id;
                if (!parsedLeader.nombre && p.team_leader_nombre) parsedLeader.nombre = p.team_leader_nombre;
                return parsedLeader;
              }
            } catch (err) {
              console.warn('Error parsing team_leader_json:', err);
            }
            return p.team_leader_id ? {
              id: p.team_leader_id,
              nombre: p.team_leader_nombre
            } : null;
          })(),
          skills: (() => {
            try {
              if (p.skills) {
                const parsedSkills = typeof p.skills === 'string' ? JSON.parse(p.skills) : p.skills;
                console.log('Skills loaded from DB:', parsedSkills);
                return parsedSkills;
              }
              return null;
            } catch (error) {
              console.warn('Error parsing skills:', error);
              return null;
            }
          })(),
          cumplimiento: (() => {
            try {
              if (p.cumplimiento) {
                const parsed = typeof p.cumplimiento === 'string' ? JSON.parse(p.cumplimiento) : p.cumplimiento;
                console.log('Cumplimiento loaded from DB (planning):', parsed);
                return parsed;
              }
              return [];
            } catch (error) {
              console.warn('Error parsing cumplimiento (planning):', error);
              return [];
            }
          })(),
          completada: p.completada,
          adjuntos: adjuntos
        };
        
        console.log('Planning phase object being sent to frontend:', planningPhase);
        console.log('🔍 Backend loadPhasesFromDatabase - teamLeader enviado al frontend:', planningPhase.teamLeader);
        console.log('🔍 Backend loadPhasesFromDatabase - teamLeader.id enviado:', planningPhase.teamLeader?.id);
        console.log('🔍 Backend loadPhasesFromDatabase - teamLeader.nombre enviado:', planningPhase.teamLeader?.nombre);
        fases.planning = planningPhase;
      }

      // Cargar kickoff
      const kickoff = await executeQuery(`
        SELECT * FROM kickoff_phases WHERE timebox_id = ?
      `, [timeboxId]);

      if (kickoff.length > 0) {
        const k = kickoff[0];
        
        // Cargar adjuntos de kickoff
        const adjuntos = await this.loadAdjuntosForPhase(k.id, 'kickoff');
        
        fases.kickOff = {
          id: k.id,
          fechaFase: k.fecha_fase,
          completada: k.completada,
          teamMovilization: (() => {
            try {
              if (!k.team_movilization) {
                console.log('No team_movilization found, returning default structure');
                return {
                  businessAmbassador: null,
                  solutionDeveloper: null,
                  solutionTester: null,
                  businessAdvisor: null,
                  technicalAdvisor: null
                };
              }
              
              console.log('Parsing team_movilization:', k.team_movilization);
              const parsed = typeof k.team_movilization === 'string' 
                ? JSON.parse(k.team_movilization)
                : k.team_movilization;
              console.log('Parsed team_movilization:', parsed);
              return parsed;
            } catch (error) {
              console.warn('Error parsing team_movilization:', error);
              return {
                businessAmbassador: null,
                solutionDeveloper: null,
                solutionTester: null,
                businessAdvisor: null,
                technicalAdvisor: null
              };
            }
          })(),
          participantes: k.participantes || undefined,
          listaAcuerdos: k.lista_acuerdos || undefined,
          financiamiento: (() => {
            try {
              if (!k.financiamiento) return undefined;
              return typeof k.financiamiento === 'string' ? JSON.parse(k.financiamiento) : k.financiamiento;
            } catch (error) {
              console.warn('Error parsing financiamiento:', error);
              return undefined;
            }
          })(),
          compensacionEconomica: (() => {
            try {
              if (!k.compensacion_economica) {
                return {
                  skills: [],
                  esfuerzoHH: 0,
                  entregaAnticipada: {
                    duracionEstimadaDias: 0,
                    valorBase: 0,
                    bonificaciones: []
                  }
                };
              }
              return typeof k.compensacion_economica === 'string' ? JSON.parse(k.compensacion_economica) : k.compensacion_economica;
            } catch (error) {
              console.warn('Error parsing compensacion_economica:', error);
              return {
                skills: [],
                esfuerzoHH: 0,
                entregaAnticipada: {
                  duracionEstimadaDias: 0,
                  valorBase: 0,
                  bonificaciones: []
                }
              };
            }
          })(),
          adjuntos: adjuntos
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
  async saveAdjuntosForPhase(phaseId, adjuntos, phaseType) {
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
  async loadAdjuntosForPhase(phaseId, phaseType) {
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
  async savePublicacionOfertaToDatabase(timeboxId, publicacionOferta) {
    try {
      const publicacionId = publicacionOferta.id || uuidv4();
      const isPublicado = !!publicacionOferta.publicado;
      const fechaPublicacion = this.formatDateForMySQL(
        publicacionOferta.fechaPublicacion || (isPublicado ? new Date() : null)
      );
      
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
          isPublicado,
          fechaPublicacion
      ]);

      // Si se publica, el timebox debe quedar en estado "Disponible"
      if (isPublicado) {
        await executeQuery(
          `UPDATE timeboxes SET estado = 'Disponible', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [timeboxId]
        );
      }

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
            this.formatDateForMySQL(postulacion.fechaPostulacion),
            postulacion.estadoSolicitud || 'Pendiente',
            postulacion.asignacion?.asignado || false,
            this.formatDateForMySQL(postulacion.asignacion?.fechaAsignacion)
          ]);
        }
      }
      
    } catch (error) {
      console.error('Error guardando publicación de oferta:', error);
      throw error;
    }
  }

  // Cargar publicación de oferta y postulaciones desde la base de datos
  async loadPublicacionOfertaFromDatabase(timeboxId) {
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

  // Asignar rol a un timebox
  async assignRoleToTimebox(req, res) {
    try {
      const { id } = req.params;
      const { postulacionId, roleKey, developerName } = req.body;
      
      console.log('Asignando rol:', {
        timeboxId: id,
        postulacionId,
        roleKey,
        developerName
      });

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

      // Verificar que la postulación existe y está pendiente
      const [postulacion] = await executeQuery(`
        SELECT p.*, po.timebox_id
        FROM postulaciones p
        JOIN publicacion_ofertas po ON p.publicacion_id = po.id
        WHERE p.id = ? AND po.timebox_id = ?
      `, [postulacionId, id]);

      if (!postulacion) {
        return res.status(404).json({
          status: false,
          message: 'Postulación no encontrada'
        });
      }

      if (postulacion.estado_solicitud !== 'Pendiente') {
        return res.status(400).json({
          status: false,
          message: 'La postulación ya no está pendiente'
        });
      }

      // Actualizar la postulación
      await executeQuery(`
        UPDATE postulaciones
        SET estado_solicitud = 'Aprobada',
            asignado = true,
            fecha_asignacion = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [postulacionId]);

      // Generar automáticamente orden de pago del anticipo
      await this.generarOrdenPagoAnticipo(id, postulacionId, roleKey, developerName);

      // Comentado: No cambiar automáticamente el estado del timebox
      // El estado solo debe cambiar cuando se complete la fase de kickoff
      // o cuando se decida explícitamente
      console.log('Manteniendo estado del timebox (no se cambia automáticamente)');
      /*
      // Actualizar el estado del timebox a "En Ejecucion"
      console.log('Actualizando estado del timebox a En Ejecucion');
      await executeQuery(`
        UPDATE timeboxes
        SET estado = 'En Ejecucion',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);
      
      // Verificar que el estado se actualizó correctamente
      const [updatedStatus] = await executeQuery('SELECT id, estado FROM timeboxes WHERE id = ?', [id]);
      console.log('Estado actualizado:', updatedStatus);
      
      // Verificar que no hay tildes en el estado
      if (updatedStatus && updatedStatus.estado.includes('ó')) {
        console.log('Corrigiendo estado con tilde');
        await executeQuery(`
          UPDATE timeboxes
          SET estado = REPLACE(estado, 'ó', 'o'),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [id]);
      }
      */

      // Obtener la fase kickoff actual
      console.log('Buscando fase kickoff para timebox:', id);
      const [kickoff] = await executeQuery(`
        SELECT * FROM kickoff_phases WHERE timebox_id = ?
      `, [id]);
      console.log('Fase kickoff encontrada:', kickoff);

      // Si no existe la fase kickoff, crearla
      if (!kickoff) {
        console.log('Creando nueva fase kickoff');
        const kickoffId = uuidv4();
        const teamMovilization = {
          businessAmbassador: null,
          solutionDeveloper: null,
          solutionTester: null,
          businessAdvisor: null,
          technicalAdvisor: null
        };
        
        // Asignar el rol específico según el roleKey
        if (roleKey && teamMovilization.hasOwnProperty(roleKey)) {
          teamMovilization[roleKey] = {
            id: postulacionId,
            nombre: developerName
          };
        }
        
        console.log('Nuevo team_movilization:', teamMovilization);
        
        await executeQuery(`
          INSERT INTO kickoff_phases (id, timebox_id, team_movilization, created_at, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          kickoffId,
          id,
          JSON.stringify(teamMovilization)
        ]);
        
        console.log('Fase kickoff creada con ID:', kickoffId);
      } else {
        console.log('Actualizando fase kickoff existente');
        // Si existe, actualizar el team_movilization
        let teamMovilization = {
          businessAmbassador: null,
          solutionDeveloper: null,
          solutionTester: null,
          businessAdvisor: null,
          technicalAdvisor: null
        };
        
        if (kickoff.team_movilization) {
          try {
            // Intentar parsear si es una cadena JSON
            const existingTeam = typeof kickoff.team_movilization === 'string' 
              ? JSON.parse(kickoff.team_movilization)
              : kickoff.team_movilization;
            
            console.log('team_movilization existente:', existingTeam);
            
            // Mantener los otros roles si existen
            if (existingTeam.businessAmbassador) teamMovilization.businessAmbassador = existingTeam.businessAmbassador;
            if (existingTeam.solutionDeveloper) teamMovilization.solutionDeveloper = existingTeam.solutionDeveloper;
            if (existingTeam.solutionTester) teamMovilization.solutionTester = existingTeam.solutionTester;
            if (existingTeam.businessAdvisor) teamMovilization.businessAdvisor = existingTeam.businessAdvisor;
            if (existingTeam.technicalAdvisor) teamMovilization.technicalAdvisor = existingTeam.technicalAdvisor;
          } catch (error) {
            console.warn('Error parsing team_movilization:', error);
          }
        }
        
        // Asignar el rol específico según el roleKey
        if (roleKey && teamMovilization.hasOwnProperty(roleKey)) {
          teamMovilization[roleKey] = {
            id: postulacionId,
            nombre: developerName
          };
        }
        
        console.log('team_movilization actualizado:', teamMovilization);

        await executeQuery(`
          UPDATE kickoff_phases
          SET team_movilization = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [JSON.stringify(teamMovilization), kickoff.id]);
        
        console.log('Fase kickoff actualizada');
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
      `, [id]);

      // Cargar las fases del timebox
      const loadedFases = await this.loadPhasesFromDatabase(id);
      updatedTimebox.fases = loadedFases;

      // Cargar publicación de oferta y postulaciones
      const loadedPublicacionOferta = await this.loadPublicacionOfertaFromDatabase(id);
      updatedTimebox.publicacionOferta = loadedPublicacionOferta;

      res.json({
        status: true,
        message: 'Rol asignado exitosamente',
        data: updatedTimebox
      });
    } catch (error) {
      console.error('Error al asignar rol:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * Genera automáticamente una orden de pago del anticipo cuando se aprueba una postulación
   */
  async generarOrdenPagoAnticipo(timeboxId, postulacionId, roleKey, developerName) {
    try {
      console.log('🔄 Generando orden de pago del anticipo para:', {
        timeboxId,
        postulacionId,
        roleKey,
        developerName
      });

      // Obtener la información del financiamiento del timebox
      const [kickoffPhase] = await executeQuery(`
        SELECT financiamiento, compensacion_economica
        FROM kickoff_phases 
        WHERE timebox_id = ?
      `, [timeboxId]);

      if (!kickoffPhase || !kickoffPhase.financiamiento) {
        console.log('⚠️ No se encontró información de financiamiento para el timebox:', timeboxId);
        return;
      }

      // Parsear el JSON del financiamiento
      let financiamiento;
      try {
        financiamiento = typeof kickoffPhase.financiamiento === 'string' 
          ? JSON.parse(kickoffPhase.financiamiento) 
          : kickoffPhase.financiamiento;
      } catch (error) {
        console.error('❌ Error parseando financiamiento:', error);
        return;
      }

      // Verificar que tenemos los datos necesarios
      if (!financiamiento.montoBase || !financiamiento.porcentajeAnticipado || !financiamiento.moneda) {
        console.log('⚠️ Datos de financiamiento incompletos:', financiamiento);
        return;
      }

      // Calcular el monto del anticipo
      const montoAnticipo = (financiamiento.montoBase * financiamiento.porcentajeAnticipado) / 100;
      
      console.log('💰 Cálculo del anticipo:', {
        montoBase: financiamiento.montoBase,
        porcentajeAnticipado: financiamiento.porcentajeAnticipado,
        montoAnticipo,
        moneda: financiamiento.moneda
      });

      // Obtener información del developer (usar el nombre como ID temporal si no hay ID real)
      const developerId = developerName; // Por ahora usamos el nombre como ID
      
      // Crear la orden de pago
      const ordenPagoId = uuidv4();
      const concepto = `Anticipo del ${financiamiento.porcentajeAnticipado}% - Timebox ${timeboxId} - Rol: ${roleKey}`;
      
      await executeQuery(`
        INSERT INTO ordenes_pago (
          id, developer_id, monto, moneda, concepto, fecha_emision, estado
        ) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, 'Pendiente')
      `, [ordenPagoId, developerId, montoAnticipo, financiamiento.moneda, concepto]);

      console.log('✅ Orden de pago creada exitosamente:', {
        id: ordenPagoId,
        developerId,
        montoAnticipo,
        moneda: financiamiento.moneda,
        concepto
      });

      // También crear un registro en la tabla de pagos para tracking
      const pagoId = uuidv4();
      await executeQuery(`
        INSERT INTO pagos (
          id, developer_id, orden_pago_id, monto, moneda, metodo, referencia
        ) VALUES (?, ?, ?, ?, ?, 'Anticipo', ?)
      `, [pagoId, developerId, ordenPagoId, montoAnticipo, financiamiento.moneda, `TB-${timeboxId}-${roleKey}`]);

      console.log('✅ Registro de pago creado:', pagoId);

    } catch (error) {
      console.error('❌ Error generando orden de pago del anticipo:', error);
      // No fallar la operación principal si hay error en la generación de la orden
    }
  }

}

// Crear una instancia del controlador
const timeboxController = new TimeboxController();

// Exportar la instancia
module.exports = timeboxController;