const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class RoleController {
  // Obtener todos los roles con sus sueldos
  async getAllRolesWithSueldos(req, res) {
    try {
      const query = `
        SELECT 
          r.id,
          r.name,
          r.description,
          r.level,
          COALESCE(rs.sueldo_base_semanal, 0) as sueldo_base_semanal,
          COALESCE(rs.moneda, 'USD') as moneda,
          rs.fecha_inicio,
          rs.is_active
        FROM roles r
        LEFT JOIN role_sueldos rs ON r.id = rs.role_id AND rs.is_active = TRUE
        WHERE r.is_active = TRUE
        ORDER BY r.name
      `;
      
      const roles = await db.executeQuery(query);
      
      res.json({
        success: true,
        data: roles,
        message: 'Roles obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener un rol específico con su sueldo
  async getRoleById(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          r.id,
          r.name,
          r.description,
          r.level,
          COALESCE(rs.sueldo_base_semanal, 0) as sueldo_base_semanal,
          COALESCE(rs.moneda, 'USD') as moneda,
          rs.fecha_inicio,
          rs.is_active
        FROM roles r
        LEFT JOIN role_sueldos rs ON r.id = rs.role_id AND rs.is_active = TRUE
        WHERE r.id = ? AND r.is_active = TRUE
      `;
      
      const roles = await db.executeQuery(query, [id]);
      
      if (roles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: roles[0],
        message: 'Rol obtenido exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar sueldo de un rol
  async updateRoleSueldo(req, res) {
    try {
      const { id } = req.params;
      const { sueldo_base_semanal, moneda = 'USD' } = req.body;
      
      // Validar que el rol existe
      const roles = await db.executeQuery('SELECT id FROM roles WHERE id = ? AND is_active = TRUE', [id]);
      if (roles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }
      
             // Validar sueldo
       if (typeof sueldo_base_semanal !== 'number' || sueldo_base_semanal < 0) {
         return res.status(400).json({
           success: false,
           message: 'El sueldo debe ser un número mayor o igual a 0'
         });
       }
       
       // Validar moneda
       if (!['USD', 'CLP'].includes(moneda)) {
         return res.status(400).json({
           success: false,
           message: 'La moneda debe ser USD o CLP'
         });
       }
      
      // Desactivar sueldo anterior si existe
      await db.executeQuery(
        'UPDATE role_sueldos SET is_active = FALSE WHERE role_id = ? AND is_active = TRUE',
        [id]
      );
      
      // Insertar nuevo sueldo
      const sueldoId = uuidv4();
      await db.executeQuery(
        'INSERT INTO role_sueldos (id, role_id, sueldo_base_semanal, moneda, fecha_inicio) VALUES (?, ?, ?, ?, CURDATE())',
        [sueldoId, id, sueldo_base_semanal, moneda]
      );
      
      res.json({
        success: true,
        message: 'Sueldo del rol actualizado exitosamente',
        data: {
          role_id: id,
          sueldo_base_semanal,
          moneda,
          fecha_inicio: new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Error al actualizar sueldo del rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener estadísticas de sueldos
  async getSueldosStats(req, res) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_roles,
          COUNT(CASE WHEN rs.sueldo_base_semanal > 0 THEN 1 END) as roles_con_sueldo,
          SUM(COALESCE(rs.sueldo_base_semanal, 0)) as total_semanal,
          SUM(COALESCE(rs.sueldo_base_semanal, 0)) * 4.33 as total_mensual
        FROM roles r
        LEFT JOIN role_sueldos rs ON r.id = rs.role_id AND rs.is_active = TRUE
        WHERE r.is_active = TRUE
      `;
      
      const stats = await db.executeQuery(query);
      
      res.json({
        success: true,
        data: stats[0],
        message: 'Estadísticas obtenidas exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = new RoleController();
