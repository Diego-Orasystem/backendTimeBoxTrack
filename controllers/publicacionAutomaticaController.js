const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class PublicacionAutomaticaController {
  constructor() {}

  /**
   * Obtiene los roles disponibles para un timebox
   */
  async getRolesDisponibles(req, res) {
    try {
      const { timeboxId } = req.params;

      // Obtener el timebox y su fase de planning
      const [timebox] = await db.executeQuery(`
        SELECT t.id, t.estado, p.esfuerzo
        FROM timeboxes t
        LEFT JOIN planning_phases p ON t.id = p.timebox_id
        WHERE t.id = ?
      `, [timeboxId]);

      if (!timebox) {
        return res.status(404).json({
          success: false,
          message: 'Timebox no encontrado'
        });
      }

      // Obtener los roles del sistema con sus sueldos
      const roles = await db.executeQuery(`
        SELECT r.id, r.name, rs.sueldo_base_semanal, rs.moneda
        FROM roles r
        LEFT JOIN role_sueldos rs ON r.id = rs.role_id
        WHERE r.is_active = TRUE AND rs.is_active = TRUE
        ORDER BY r.level ASC
      `);

      // Mapear los roles a la estructura esperada
      const rolesDisponibles = roles.map(role => ({
        key: role.id,
        nombre: role.name,
        sueldoSemanal: role.sueldo_base_semanal || 0,
        moneda: role.moneda || 'USD'
      }));

      res.json({
        success: true,
        data: rolesDisponibles
      });

    } catch (error) {
      console.error('Error obteniendo roles disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crea publicaciones automáticas para todos los roles disponibles
   */
  async crearPublicacionesAutomaticas(req, res) {
    try {
      const { timeboxId } = req.params;

      // Obtener el timebox y su fase de planning
      const [timebox] = await db.executeQuery(`
        SELECT t.id, t.estado, p.esfuerzo
        FROM timeboxes t
        LEFT JOIN planning_phases p ON t.id = p.timebox_id
        WHERE t.id = ?
      `, [timeboxId]);

      if (!timebox) {
        return res.status(404).json({
          success: false,
          message: 'Timebox no encontrado'
        });
      }

      // Parsear el esfuerzo a semanas
      const semanasProyecto = this.parsearEsfuerzoASemanas(timebox.esfuerzo);

      // Obtener los roles con sueldos
      const roles = await db.executeQuery(`
        SELECT r.id, r.name, rs.sueldo_base_semanal, rs.moneda
        FROM roles r
        LEFT JOIN role_sueldos rs ON r.id = rs.role_id
        WHERE r.is_active = TRUE AND rs.is_active = TRUE
        ORDER BY r.level ASC
      `);

      // Crear publicaciones para cada rol
      const publicaciones = [];
      
      for (const role of roles) {
        const financiamientoTotal = (role.sueldo_base_semanal || 0) * semanasProyecto;
        
        const publicacionId = uuidv4();
        
        // Insertar la publicación en la base de datos
        await db.executeQuery(`
          INSERT INTO publicaciones_automaticas (
            id, timebox_id, rol, sueldo_semanal, moneda, 
            semanas_proyecto, financiamiento_total, publicado, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP)
        `, [
          publicacionId,
          timeboxId,
          role.name,
          role.sueldo_base_semanal || 0,
          role.moneda || 'USD',
          semanasProyecto,
          financiamientoTotal
        ]);

        publicaciones.push({
          id: publicacionId,
          timeboxId,
          rol: role.name,
          sueldoSemanal: role.sueldo_base_semanal || 0,
          moneda: role.moneda || 'USD',
          semanasProyecto,
          financiamientoTotal,
          publicado: false
        });
      }

      res.json({
        success: true,
        data: publicaciones,
        message: `Se crearon ${publicaciones.length} publicaciones automáticas`
      });

    } catch (error) {
      console.error('Error creando publicaciones automáticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Publica una oferta específica
   */
  async publicarOferta(req, res) {
    try {
      const { publicacionId } = req.params;

      // Actualizar el estado de la publicación
      await db.executeQuery(`
        UPDATE publicaciones_automaticas 
        SET publicado = TRUE, fecha_publicacion = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [publicacionId]);

      res.json({
        success: true,
        message: 'Oferta publicada exitosamente'
      });

    } catch (error) {
      console.error('Error publicando oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene todas las publicaciones de un timebox
   */
  async getPublicacionesPorTimebox(req, res) {
    try {
      const { timeboxId } = req.params;

      const publicaciones = await db.executeQuery(`
        SELECT id, timebox_id, rol, sueldo_semanal, moneda,
               semanas_proyecto, financiamiento_total, publicado, fecha_publicacion
        FROM publicaciones_automaticas
        WHERE timebox_id = ?
        ORDER BY created_at ASC
      `, [timeboxId]);

      res.json({
        success: true,
        data: publicaciones
      });

    } catch (error) {
      console.error('Error obteniendo publicaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Convierte el esfuerzo del planning a semanas
   */
  parsearEsfuerzoASemanas(esfuerzo) {
    if (!esfuerzo) return 1;
    
    const match = esfuerzo.match(/(\d+)\s*sem/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    // Si no es formato "X sem", asumir 1 semana
    return 1;
  }
}

module.exports = new PublicacionAutomaticaController();



