const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

class UserController {
  // =====================================================
  // AUTENTICACIÓN
  // =====================================================

  /**
   * Login de usuario
   */
  static async login(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { identifier, password } = req.body;

      // Autenticar usuario
      const result = await User.authenticate(identifier, password);
      
      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: result.message
        });
      }

      // Enviar respuesta exitosa
      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Logout de usuario
   */
  static async logout(req, res) {
    try {
      const userId = req.user.id;
      
      // Revocar tokens del usuario
      const result = await User.logout(userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Logout exitoso'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al cerrar sesión'
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Logout de usuario sin requerir token válido
   */
  static async logoutNoAuth(req, res) {
    try {
      // Intentar extraer el token del header si existe
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        try {
          // Verificar si el token es válido
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          
          if (decoded && decoded.id) {
            // Si el token es válido, hacer logout completo
            const result = await User.logout(decoded.id);
            console.log('Logout completo para usuario:', decoded.id);
          }
        } catch (jwtError) {
          // Token inválido o expirado, solo limpiar datos locales
          console.log('Token inválido en logout, limpiando datos locales');
        }
      }
      
      // Siempre devolver éxito para logout
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout sin auth:', error);
      // Aún así devolver éxito para logout
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    }
  }

  /**
   * Refrescar token de acceso
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Token de refresh requerido'
        });
      }

      const result = await User.refreshAccessToken(refreshToken);
      
      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: {
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      console.error('Error al refrescar token:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Verificar token de acceso
   */
  static async verifyToken(req, res) {
    try {
      // El middleware de autenticación ya verificó el token
      // Solo devolvemos la información del usuario
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user
        }
      });
    } catch (error) {
      console.error('Error al verificar token:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // =====================================================
  // GESTIÓN DE USUARIOS
  // =====================================================

  /**
   * Crear nuevo usuario
   */
  static async createUser(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const userData = req.body;

      // Verificar si el username o email ya existen
      const existingUsername = await User.findByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }

      const existingEmail = await User.findByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }

      // Crear usuario
      const newUser = await User.create(userData);

      // Remover contraseña de la respuesta
      delete newUser.password_hash;

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: newUser
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Registrar un nuevo usuario
   */
  static async register(req, res) {
    try {
      const { username, email, firstName, lastName, password } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findByUsernameOrEmail(username, email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.username === username ? 
            'El nombre de usuario ya está en uso' : 
            'El email ya está registrado'
        });
      }

      // Crear el nuevo usuario
      const newUser = await User.create({
        username,
        email,
        firstName,
        lastName,
        password
      });

      // Asignar rol por defecto (Stakeholder)
      await User.assignRole(newUser.id, 'role-016'); // Stakeholder

      // Generar tokens
      const accessToken = jwt.sign(
        { userId: newUser.id, username: newUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: newUser.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Almacenar refresh token
      await User.storeRefreshToken(newUser.id, refreshToken);

      // Log de actividad
      await User.logActivity(newUser.id, 'user_registered', 'user', newUser.id, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            isActive: newUser.isActive,
            emailVerified: newUser.emailVerified,
            createdAt: newUser.createdAt
          },
          token: accessToken,
          refreshToken: refreshToken
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Remover contraseña de la respuesta
      delete user.password_hash;

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Remover contraseña de la respuesta
      delete user.password_hash;

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener todos los usuarios
   */
  static async getAllUsers(req, res) {
    try {
      const { is_active, role, limit } = req.query;
      const options = {};

      if (is_active !== undefined) {
        options.is_active = is_active === 'true';
      }

      if (role) {
        options.role = role;
      }

      if (limit) {
        options.limit = parseInt(limit);
      }

      const users = await User.findAll(options);

      // Remover contraseñas de la respuesta
      users.forEach(user => delete user.password_hash);

      res.json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar usuario
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar si el usuario existe
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Si se está actualizando el email, verificar que no esté en uso
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailInUse = await User.findByEmail(updateData.email);
        if (emailInUse && emailInUse.id !== id) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está en uso por otro usuario'
          });
        }
      }

      // Si se está actualizando el username, verificar que no esté en uso
      if (updateData.username && updateData.username !== existingUser.username) {
        const usernameInUse = await User.findByUsername(updateData.username);
        if (usernameInUse && usernameInUse.id !== id) {
          return res.status(400).json({
            success: false,
            message: 'El nombre de usuario ya está en uso por otro usuario'
          });
        }
      }

      // Actualizar usuario
      const updatedUser = await User.update(id, updateData);

      // Remover contraseña de la respuesta
      delete updatedUser.password_hash;

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar perfil del usuario autenticado
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // No permitir actualizar campos sensibles desde el perfil
      delete updateData.username;
      delete updateData.email;
      delete updateData.is_active;
      delete updateData.is_verified;
      delete updateData.roles;

      // Actualizar usuario
      const updatedUser = await User.update(userId, updateData);

      // Remover contraseña de la respuesta
      delete updatedUser.password_hash;

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Cambiar contraseña del usuario autenticado
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Validar entrada
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva contraseña son requeridas'
        });
      }

      // Verificar contraseña actual
      const user = await User.findById(userId);
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Actualizar contraseña
      await User.update(userId, { password: newPassword });

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar usuario (soft delete)
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Verificar si el usuario existe
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Eliminar usuario
      await User.delete(id);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // =====================================================
  // GESTIÓN DE ROLES
  // =====================================================

  /**
   * Obtener roles de un usuario
   */
  static async getUserRoles(req, res) {
    try {
      const { id } = req.params;
      const { project_id, timebox_id } = req.query;

      const options = {};
      if (project_id) options.project_id = project_id;
      if (timebox_id) options.timebox_id = timebox_id;

      const roles = await User.getUserRoles(id, options);

      res.json({
        success: true,
        count: roles.length,
        data: roles
      });
    } catch (error) {
      console.error('Error al obtener roles del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Asignar rol a usuario
   */
  static async assignRole(req, res) {
    try {
      const { id } = req.params;
      const { role_id, project_id, timebox_id, expires_at } = req.body;
      const assignedBy = req.user.id;

      // Verificar que el usuario existe
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const options = {};
      if (project_id) options.project_id = project_id;
      if (timebox_id) options.timebox_id = timebox_id;
      if (expires_at) options.expires_at = new Date(expires_at);

      // Asignar rol
      await User.assignRole(id, role_id, assignedBy, options);

      res.json({
        success: true,
        message: 'Rol asignado exitosamente'
      });
    } catch (error) {
      console.error('Error al asignar rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Remover rol de usuario
   */
  static async removeRole(req, res) {
    try {
      const { id } = req.params;
      const { role_id, project_id, timebox_id } = req.body;

      // Verificar que el usuario existe
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Remover rol
      await User.removeRole(id, role_id, project_id, timebox_id);

      res.json({
        success: true,
        message: 'Rol removido exitosamente'
      });
    } catch (error) {
      console.error('Error al remover rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // =====================================================
  // RECUPERACIÓN DE CONTRASEÑA
  // =====================================================

  /**
   * Solicitar reseteo de contraseña
   */
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email es requerido'
        });
      }

      // Crear token de reseteo
      const result = await User.createPasswordResetToken(email);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message
        });
      }

      // TODO: Enviar email con el token
      // Por ahora, solo devolvemos el token en la respuesta
      // En producción, esto debería enviarse por email

      res.json({
        success: true,
        message: 'Se ha enviado un enlace de reseteo a tu email',
        data: {
          token: result.token, // Solo para desarrollo
          expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
        }
      });
    } catch (error) {
      console.error('Error al solicitar reseteo de contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Resetear contraseña con token
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token y nueva contraseña son requeridos'
        });
      }

      // Resetear contraseña
      const result = await User.resetPassword(token, newPassword);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // =====================================================
  // ESTADÍSTICAS Y REPORTES
  // =====================================================

  /**
   * Obtener estadísticas de usuarios
   */
  static async getUserStats(req, res) {
    try {
      const stats = await User.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Buscar usuarios por rol
   */
  static async findUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const { project_id, timebox_id } = req.query;

      const options = {};
      if (project_id) options.project_id = project_id;
      if (timebox_id) options.timebox_id = timebox_id;

      const users = await User.findByRole(role, options);

      // Remover contraseñas de la respuesta
      users.forEach(user => delete user.password_hash);

      res.json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      console.error('Error al buscar usuarios por rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = UserController;
