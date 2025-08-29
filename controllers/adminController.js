const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

class AdminController {
  // Obtener todos los usuarios
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      
      res.json({
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: users
      });
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener usuario por ID
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
      
      res.json({
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: user
      });
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Crear nuevo usuario
  static async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const {
        username,
        email,
        firstName,
        lastName,
        password,
        roleId,
        isActive,
        isVerified
      } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findByUsernameOrEmail(username, email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El usuario o email ya existe'
        });
      }

      // Hash de la contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Crear el usuario
      const newUser = await User.create({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password_hash: hashedPassword,
        is_active: isActive !== undefined ? isActive : true,
        is_verified: isVerified !== undefined ? isVerified : false
      });

      // Asignar rol por defecto si se proporciona
      if (roleId) {
        await User.assignRole(newUser.id, roleId, req.user?.id || 'admin');
      }

      // Log de actividad
      await User.logActivity(newUser.id, 'USER_CREATED', 'USER', newUser.id, {
        created_by: req.user?.id || 'admin',
        role_assigned: roleId
      });

      // Obtener usuario con roles
      const userWithRoles = await User.findById(newUser.id);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: userWithRoles
      });
    } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar usuario
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const {
        username,
        email,
        firstName,
        lastName,
        password,
        roleId,
        isActive,
        isVerified
      } = req.body;

      // Verificar si el usuario existe
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar si el username o email ya existe en otro usuario
      if (username && username !== existingUser.username) {
        const userWithUsername = await User.findByUsernameOrEmail(username);
        if (userWithUsername && userWithUsername.id !== id) {
          return res.status(400).json({
            success: false,
            message: 'El nombre de usuario ya está en uso'
          });
        }
      }

      if (email && email !== existingUser.email) {
        const userWithEmail = await User.findByUsernameOrEmail(null, email);
        if (userWithEmail && userWithEmail.id !== id) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está en uso'
          });
        }
      }

      // Preparar datos de actualización
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      if (isActive !== undefined) updateData.is_active = isActive;
      if (isVerified !== undefined) updateData.is_verified = isVerified;

      // Hash de la nueva contraseña si se proporciona
      if (password && password.trim() !== '') {
        const saltRounds = 12;
        updateData.password_hash = await bcrypt.hash(password, saltRounds);
      }

      // Actualizar usuario
      await User.update(id, updateData);

      // Actualizar rol si se proporciona
      if (roleId) {
        await User.updateUserRole(id, roleId);
      }

      // Log de actividad
      await User.logActivity(id, 'USER_UPDATED', 'USER', id, {
        updated_by: req.user?.id || 'admin',
        fields_updated: Object.keys(updateData)
      });

      // Obtener usuario actualizado
      const updatedUser = await User.findById(id);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Cambiar estado del usuario (activo/inactivo)
  static async toggleUserStatus(req, res) {
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

      // Cambiar estado
      const newStatus = !existingUser.is_active;
      await User.update(id, { is_active: newStatus });

      // Log de actividad
      await User.logActivity(id, 'USER_STATUS_CHANGED', 'USER', id, {
        changed_by: req.user?.id || 'admin',
        new_status: newStatus,
        previous_status: existingUser.is_active
      });

      res.json({
        success: true,
        message: `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
        data: { id, is_active: newStatus }
      });
    } catch (error) {
      console.error('Error cambiando estado del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar usuario
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

      // No permitir eliminar el usuario admin principal
      if (existingUser.username === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el usuario administrador principal'
        });
      }

      // Eliminar usuario
      await User.delete(id);

      // Log de actividad
      await User.logActivity(id, 'USER_DELETED', 'USER', id, {
        deleted_by: req.user?.id || 'admin',
        deleted_username: existingUser.username
      });

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
        data: { id }
      });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener roles disponibles
  static async getAvailableRoles(req, res) {
    try {
      const { executeQuery } = require('../config/database');
      
      const roles = await executeQuery(`
        SELECT id, name, level, description, created_at, updated_at
        FROM roles 
        ORDER BY level DESC, name ASC
      `);
      
      res.json({
        success: true,
        message: 'Roles obtenidos exitosamente',
        data: roles
      });
    } catch (error) {
      console.error('Error obteniendo roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = AdminController;

