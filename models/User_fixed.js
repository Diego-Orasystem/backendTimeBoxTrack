const { executeQuery, executeTransaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  // =====================================================
  // MÉTODOS DE AUTENTICACIÓN
  // =====================================================

  /**
   * Autenticar usuario con username/email y contraseña
   */
  static async authenticate(identifier, password) {
    try {
      // Buscar usuario por username o email
      const sql = `
        SELECT u.*, 
               GROUP_CONCAT(DISTINCT r.name) as roles,
               GROUP_CONCAT(DISTINCT r.level) as role_levels
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
        WHERE (u.username = ? OR u.email = ?) AND u.is_active = TRUE
        GROUP BY u.id
      `;
      
      const users = await executeQuery(sql, [identifier, identifier]);
      if (users.length === 0) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      const user = users[0];
      
      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return { success: false, message: 'Contraseña incorrecta' };
      }

      // Verificar si el usuario está verificado
      if (!user.is_verified) {
        return { success: false, message: 'Usuario no verificado' };
      }

      // Actualizar último login
      await this.updateLastLogin(user.id);

      // Generar tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user.id);

      // Obtener permisos del usuario
      const permissions = await this.getUserPermissions(user.id);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          roles: user.roles ? user.roles.split(',') : [],
          role_levels: user.role_levels ? user.role_levels.split(',') : [],
          permissions: permissions,
          phone: user.phone,
          avatar_url: user.avatar_url,
          is_active: user.is_active
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('Error en autenticación:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }

  /**
   * Generar token de acceso JWT
   */
  static generateAccessToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles ? user.roles.split(',') : []
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
  }

  /**
   * Generar token de refresh
   */
  static async generateRefreshToken(userId) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

    const sql = `
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `;

    await executeQuery(sql, [
      uuidv4(),
      userId,
      token,
      expiresAt
    ]);

    return token;
  }

  /**
   * Refrescar token de acceso
   */
  static async refreshAccessToken(refreshToken) {
    try {
      const sql = `
        SELECT rt.*, u.id, u.username, u.email, u.is_active
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token = ? AND rt.is_revoked = FALSE AND rt.expires_at > NOW()
      `;

      const tokens = await executeQuery(sql, [refreshToken]);
      if (tokens.length === 0) {
        return { success: false, message: 'Token de refresh inválido o expirado' };
      }

      const tokenData = tokens[0];
      if (!tokenData.is_active) {
        return { success: false, message: 'Usuario inactivo' };
      }

      // Generar nuevo token de acceso
      const user = {
        id: tokenData.user_id,
        username: tokenData.username,
        email: tokenData.email
      };

      const accessToken = this.generateAccessToken(user);
      return { success: true, accessToken };
    } catch (error) {
      console.error('Error al refrescar token:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }

  /**
   * Revocar token de refresh
   */
  static async revokeRefreshToken(refreshToken) {
    try {
      const sql = `
        UPDATE refresh_tokens 
        SET is_revoked = TRUE
        WHERE token = ?
      `;

      await executeQuery(sql, [refreshToken]);
      return { success: true };
    } catch (error) {
      console.error('Error al revocar token:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }

  /**
   * Cerrar sesión (revocar todos los tokens del usuario)
   */
  static async logout(userId) {
    try {
      const sql = `
        UPDATE refresh_tokens 
        SET is_revoked = TRUE
        WHERE user_id = ? AND is_revoked = FALSE
      `;

      await executeQuery(sql, [userId]);
      return { success: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }

  // =====================================================
  // MÉTODOS CRUD DE USUARIOS
  // =====================================================

  /**
   * Crear nuevo usuario
   */
  static async create(userData) {
    try {
      const id = uuidv4();
      
      // Hash de la contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password_hash, saltRounds);

      const sql = `
        INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await executeQuery(sql, [
        id,
        userData.username,
        userData.email,
        passwordHash,
        userData.first_name,
        userData.last_name,
        userData.phone || null,
        userData.avatar_url || null
      ]);

      // Asignar rol por defecto si se especifica
      if (userData.default_role_id) {
        await this.assignRole(id, userData.default_role_id);
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT u.*, 
               GROUP_CONCAT(DISTINCT r.name) as roles,
               GROUP_CONCAT(DISTINCT r.id) as role_ids
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
        WHERE u.id = ?
        GROUP BY u.id
      `;

      const users = await executeQuery(sql, [id]);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error al buscar usuario:', error);
      throw error;
    }
  }

  /**
   * Buscar usuario por username
   */
  static async findByUsername(username) {
    try {
      const sql = 'SELECT * FROM users WHERE username = ?';
      const users = await executeQuery(sql, [username]);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error al buscar usuario por username:', error);
      throw error;
    }
  }

  /**
   * Buscar usuario por email
   */
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      const users = await executeQuery(sql, [email]);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error al buscar usuario por email:', error);
      throw error;
    }
  }

  /**
   * Buscar usuario por username o email
   */
  static async findByUsernameOrEmail(username, email) {
    try {
      const sql = `
        SELECT u.*, 
               GROUP_CONCAT(DISTINCT r.name) as roles,
               GROUP_CONCAT(DISTINCT r.level) as role_levels
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
        WHERE (u.username = ? OR u.email = ?) AND u.is_active = TRUE
        GROUP BY u.id
      `;
      const users = await executeQuery(sql, [username, email]);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error buscando usuario por username/email:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  static async findAll(options = {}) {
    try {
      let sql = `
        SELECT u.*, 
               GROUP_CONCAT(DISTINCT r.name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
      `;

      const whereConditions = [];
      const params = [];

      if (options.is_active !== undefined) {
        whereConditions.push('u.is_active = ?');
        params.push(options.is_active);
      }

      if (options.role) {
        whereConditions.push('r.name = ?');
        params.push(options.role);
      }

      if (whereConditions.length > 0) {
        sql += ' WHERE ' + whereConditions.join(' AND ');
      }

      sql += ' GROUP BY u.id ORDER BY u.created_at DESC';

      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }

      return await executeQuery(sql, params);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  static async update(id, userData) {
    try {
      const updateFields = [];
      const params = [];

      if (userData.first_name !== undefined) {
        updateFields.push('first_name = ?');
        params.push(userData.first_name);
      }

      if (userData.last_name !== undefined) {
        updateFields.push('last_name = ?');
        params.push(userData.last_name);
      }

      if (userData.email !== undefined) {
        updateFields.push('email = ?');
        params.push(userData.email);
      }

      if (userData.phone !== undefined) {
        updateFields.push('phone = ?');
        params.push(userData.phone);
      }

      if (userData.avatar_url !== undefined) {
        updateFields.push('avatar_url = ?');
        params.push(userData.avatar_url);
      }

      if (userData.is_active !== undefined) {
        updateFields.push('is_active = ?');
        params.push(userData.is_active);
      }

      if (userData.password) {
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);
        updateFields.push('password_hash = ?');
        params.push(passwordHash);
      }

      if (updateFields.length === 0) {
        return await this.findById(id);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await executeQuery(sql, params);

      return await this.findById(id);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario (soft delete)
   */
  static async delete(id) {
    try {
      const sql = 'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(sql, [id]);
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS DE GESTIÓN DE ROLES
  // =====================================================

  /**
   * Asignar rol a usuario
   */
  static async assignRole(userId, roleId, assignedBy, options = {}) {
    try {
      const id = uuidv4();
      const sql = `
        INSERT INTO user_roles (id, user_id, role_id, project_id, timebox_id, assigned_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;

      await executeQuery(sql, [
        id,
        userId,
        roleId,
        options.project_id || null,
        options.timebox_id || null
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error al asignar rol:', error);
      throw error;
    }
  }

  /**
   * Remover rol de usuario
   */
  static async removeRole(userId, roleId, projectId = null, timeboxId = null) {
    try {
      const sql = `
        DELETE FROM user_roles
        WHERE user_id = ? AND role_id = ? 
        AND (project_id = ? OR (project_id IS NULL AND ? IS NULL))
        AND (timebox_id = ? OR (timebox_id IS NULL AND ? IS NULL))
      `;

      await executeQuery(sql, [userId, roleId, projectId, projectId, timeboxId, timeboxId]);
      return { success: true };
    } catch (error) {
      console.error('Error al remover rol:', error);
      throw error;
    }
  }

  /**
   * Obtener roles de un usuario
   */
  static async getUserRoles(userId, options = {}) {
    try {
      let sql = `
        SELECT r.*, ur.project_id, ur.timebox_id, ur.assigned_at
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ? AND r.is_active = TRUE
      `;

      const params = [userId];

      if (options.project_id !== undefined) {
        sql += ' AND (ur.project_id = ? OR ur.project_id IS NULL)';
        params.push(options.project_id);
      }

      if (options.timebox_id !== undefined) {
        sql += ' AND (ur.timebox_id = ? OR ur.timebox_id IS NULL)';
        params.push(options.timebox_id);
      }

      sql += ' ORDER BY r.level, r.name';

      return await executeQuery(sql, params);
    } catch (error) {
      console.error('Error al obtener roles del usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener permisos de un usuario
   */
  static async getUserPermissions(userId, options = {}) {
    try {
      let sql = `
        SELECT DISTINCT p.name, p.resource, p.action
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ? 
        AND r.is_active = TRUE 
        AND p.is_active = TRUE
      `;

      const params = [userId];

      if (options.project_id !== undefined) {
        sql += ' AND (ur.project_id = ? OR ur.project_id IS NULL)';
        params.push(options.project_id);
      }

      if (options.timebox_id !== undefined) {
        sql += ' AND (ur.timebox_id = ? OR ur.timebox_id IS NULL)';
        params.push(options.timebox_id);
      }

      const permissions = await executeQuery(sql, params);
      
      // Convertir a formato más útil
      const permissionMap = {};
      permissions.forEach(perm => {
        if (!permissionMap[perm.resource]) {
          permissionMap[perm.resource] = [];
        }
        permissionMap[perm.resource].push(perm.action);
      });

      return permissionMap;
    } catch (error) {
      console.error('Error al obtener permisos del usuario:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS DE RECUPERACIÓN DE CONTRASEÑA
  // =====================================================

  /**
   * Crear token de reseteo de contraseña
   */
  static async createPasswordResetToken(email) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      // Revocar tokens anteriores
      const revokeSql = `
        UPDATE password_resets 
        SET used_at = NOW()
        WHERE user_id = ? AND used_at IS NULL
      `;
      await executeQuery(revokeSql, [user.id]);

      // Crear nuevo token
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora

      const sql = `
        INSERT INTO password_resets (id, user_id, token, expires_at)
        VALUES (?, ?, ?, ?)
      `;

      await executeQuery(sql, [
        uuidv4(),
        user.id,
        token,
        expiresAt
      ]);

      return { success: true, token, user };
    } catch (error) {
      console.error('Error al crear token de reseteo:', error);
      throw error;
    }
  }

  /**
   * Resetear contraseña con token
   */
  static async resetPassword(token, newPassword) {
    try {
      const sql = `
        SELECT pr.*, u.id, u.email
        FROM password_resets pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.token = ? AND pr.used_at IS NULL AND pr.expires_at > NOW()
      `;

      const resets = await executeQuery(sql, [token]);
      if (resets.length === 0) {
        return { success: false, message: 'Token inválido o expirado' };
      }

      const resetData = resets[0];

      // Hash de la nueva contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      const updateSql = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(updateSql, [passwordHash, resetData.user_id]);

      // Marcar token como usado
      const markUsedSql = 'UPDATE password_resets SET used_at = NOW() WHERE id = ?';
      await executeQuery(markUsedSql, [resetData.id]);

      return { success: true, message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  /**
   * Actualizar último login
   */
  static async updateLastLogin(userId) {
    try {
      const sql = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(sql, [userId]);
    } catch (error) {
      console.error('Error al actualizar último login:', error);
    }
  }

  /**
   * Verificar si usuario tiene permiso específico
   */
  static async hasPermission(userId, resource, action, options = {}) {
    try {
      const permissions = await this.getUserPermissions(userId, options);
      
      if (permissions['*'] && permissions['*'].includes('all')) {
        return true;
      }

      if (permissions[resource] && permissions[resource].includes(action)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al verificar permiso:', error);
      return false;
    }
  }

  /**
   * Buscar usuarios por rol
   */
  static async findByRole(roleName, options = {}) {
    try {
      let sql = `
        SELECT u.*, ur.project_id, ur.timebox_id
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = ? AND r.is_active = TRUE AND u.is_active = TRUE
      `;

      const params = [roleName];

      if (options.project_id !== undefined) {
        sql += ' AND (ur.project_id = ? OR ur.project_id IS NULL)';
        params.push(options.project_id);
      }

      if (options.timebox_id !== undefined) {
        sql += ' AND (ur.timebox_id = ? OR ur.timebox_id IS NULL)';
        params.push(options.timebox_id);
      }

      sql += ' ORDER BY u.first_name, u.last_name';

      return await executeQuery(sql, params);
    } catch (error) {
      console.error('Error al buscar usuarios por rol:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  static async getStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
          COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified_users,
          COUNT(CASE WHEN last_login_at > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as recent_users
        FROM users
      `;

      const result = await executeQuery(sql);
      return result[0];
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Almacenar refresh token
   */
  static async storeRefreshToken(userId, token) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

      const sql = `
        INSERT INTO refresh_tokens (id, user_id, token, expires_at)
        VALUES (?, ?, ?, ?)
      `;

      await executeQuery(sql, [
        uuidv4(),
        userId,
        token,
        expiresAt
      ]);
    } catch (error) {
      console.error('Error almacenando refresh token:', error);
      throw error;
    }
  }

  /**
   * Log de actividad del usuario
   */
  static async logActivity(userId, action, resourceType, resourceId, details) {
    try {
      const sql = `
        INSERT INTO user_activities (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await executeQuery(sql, [
        uuidv4(),
        userId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(details),
        details.ip || '127.0.0.1',
        details.userAgent || 'Unknown'
      ]);
    } catch (error) {
      console.error('Error loggeando actividad:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  // =====================================================
  // MÉTODOS PARA ADMINISTRACIÓN DE USUARIOS
  // =====================================================

  /**
   * Método para asignar rol a un usuario (versión simplificada para admin)
   */
  static async assignRole(userId, roleId, assignedBy = null) {
    try {
      const { executeQuery } = require('../config/database');
      
      // Verificar si ya tiene el rol asignado
      const existingRole = await executeQuery(
        'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
        [userId, roleId]
      );
      
      if (existingRole.length === 0) {
        // Asignar nuevo rol
        await executeQuery(
          'INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (UUID(), ?, ?, NOW())',
          [userId, roleId]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error asignando rol:', error);
      throw error;
    }
  }

  /**
   * Método para actualizar rol de un usuario
   */
  static async updateUserRole(userId, roleId, assignedBy = null) {
    try {
      const { executeQuery } = require('../config/database');
      
      // Eliminar roles existentes
      await executeQuery(
        'DELETE FROM user_roles WHERE user_id = ?',
        [userId]
      );
      
      // Asignar nuevo rol
      await executeQuery(
        'INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (UUID(), ?, ?, NOW())',
        [userId, roleId]
      );
      
      return true;
    } catch (error) {
      console.error('Error actualizando rol:', error);
      throw error;
    }
  }

  /**
   * Método para actualizar usuario (versión para admin)
   */
  static async update(userId, updateData) {
    try {
      const { executeQuery } = require('../config/database');
      
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      
      if (fields.length === 0) {
        return false;
      }
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      await executeQuery(query, [...values, userId]);
      
      return true;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  /**
   * Método para eliminar usuario (hard delete para admin)
   */
  static async delete(userId) {
    try {
      const { executeQuery } = require('../config/database');
      
      // Eliminar roles del usuario
      await executeQuery(
        'DELETE FROM user_roles WHERE user_id = ?',
        [userId]
      );
      
      // Eliminar tokens de refresh
      await executeQuery(
        'DELETE FROM refresh_tokens WHERE user_id = ?',
        [userId]
      );
      
      // Eliminar usuario
      await executeQuery(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );
      
      return true;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  /**
   * Método para obtener usuario con roles (versión para admin)
   */
  static async findById(userId) {
    try {
      const { executeQuery } = require('../config/database');
      
      const users = await executeQuery(
        `SELECT u.*, 
                 GROUP_CONCAT(r.name) as role_names,
                 GROUP_CONCAT(r.id) as role_ids
          FROM users u 
          LEFT JOIN user_roles ur ON u.id = ur.user_id 
          LEFT JOIN roles r ON ur.role_id = r.id 
          WHERE u.id = ?
          GROUP BY u.id`,
        [userId]
      );
      
      if (users.length === 0) {
        return null;
      }
      
      const user = users[0];
      
      // Procesar roles
      if (user.role_names) {
        user.roles = user.role_names.split(',').map((name, index) => ({
          id: user.role_ids.split(',')[index],
          name: name.trim()
        }));
      } else {
        user.roles = [];
      }
      
      // Eliminar campos auxiliares
      delete user.role_names;
      delete user.role_ids;
      
      return user;
    } catch (error) {
      console.error('Error obteniendo usuario por ID:', error);
      throw error;
    }
  }

  /**
   * Método para obtener todos los usuarios con roles (versión para admin)
   */
  static async findAll() {
    try {
      const { executeQuery } = require('../config/database');
      
      const users = await executeQuery(
        `SELECT u.*, 
                 GROUP_CONCAT(r.name) as role_names,
                 GROUP_CONCAT(r.id) as role_ids
          FROM users u 
          LEFT JOIN user_roles ur ON u.id = ur.user_id 
          LEFT JOIN roles r ON ur.role_id = r.id 
          GROUP BY u.id
          ORDER BY u.created_at DESC`
      );
      
      // Procesar cada usuario
      return users.map(user => {
        // Procesar roles
        if (user.role_names) {
          user.roles = user.role_names.split(',').map((name, index) => ({
            id: user.role_ids.split(',')[index],
            name: name.trim()
          }));
        } else {
          user.roles = [];
        }
        
        // Eliminar campos auxiliares
        delete user.role_names;
        delete user.role_ids;
        
        return user;
      });
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }
}

module.exports = User;
