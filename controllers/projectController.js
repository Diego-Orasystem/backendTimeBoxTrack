const Project = require('../models/Project');
const { validationResult } = require('express-validator');

class ProjectController {
  // Obtener todos los proyectos
  static async getAllProjects(req, res) {
    try {
      const projects = await Project.findAll();
      res.json({
        status: true,
        message: 'Proyectos obtenidos exitosamente',
        data: projects
      });
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener proyecto por ID
  static async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({
          status: false,
          message: 'Proyecto no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Proyecto obtenido exitosamente',
        data: project
      });
    } catch (error) {
      console.error('Error al obtener proyecto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener proyecto con contenido
  static async getProjectWithContent(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.getWithContent(id);
      
      if (!project) {
        return res.status(404).json({
          status: false,
          message: 'Proyecto no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Proyecto con contenido obtenido exitosamente',
        data: project
      });
    } catch (error) {
      console.error('Error al obtener proyecto con contenido:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Crear nuevo proyecto
  static async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const projectData = req.body;
      const newProject = await Project.create(projectData);
      
      res.status(201).json({
        status: true,
        message: 'Proyecto creado exitosamente',
        data: newProject
      });
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar proyecto
  static async updateProject(req, res) {
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

      const projectData = req.body;
      const updatedProject = await Project.update(id, projectData);
      
      if (!updatedProject) {
        return res.status(404).json({
          status: false,
          message: 'Proyecto no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Proyecto actualizado exitosamente',
        data: updatedProject
      });
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar proyecto
  static async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const result = await Project.delete(id);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: 'Proyecto no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Proyecto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Agregar contenido al proyecto
  static async addProjectContent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const contentData = req.body;
      
      // Determinar el projectId basado en el parentId
      let projectId = null;
      
      if (contentData.parentId) {
        // Si hay parentId, obtener el proyecto padre del contenido
        const parentContent = await Project.getContentById(contentData.parentId);
        if (!parentContent) {
          return res.status(400).json({
            status: false,
            message: 'El contenido padre no existe'
          });
        }
        projectId = parentContent.project_id;
      } else {
        // Si no hay parentId, necesitamos el projectId en el body
        if (!contentData.projectId) {
          return res.status(400).json({
            status: false,
            message: 'Se requiere projectId para contenido raíz'
          });
        }
        projectId = contentData.projectId;
      }

      // Si el contenido tiene un adjunto, verificar que existe
      if (contentData.adjuntoId) {
        const { executeQuery } = require('../config/database');
        const adjuntoSql = 'SELECT * FROM adjuntos WHERE id = ?';
        const [adjunto] = await executeQuery(adjuntoSql, [contentData.adjuntoId]);
        
        if (!adjunto) {
          return res.status(400).json({
            status: false,
            message: 'El adjunto especificado no existe',
            error: 'adjuntoId inválido'
          });
        }
      }

      const newContent = await Project.addContent(projectId, contentData);
      
      res.status(201).json({
        status: true,
        message: 'Contenido agregado exitosamente',
        data: newContent
      });
    } catch (error) {
      console.error('Error al agregar contenido:', error);
      
      // Manejar errores específicos de validación
      if (error.message.includes('contenido padre') || error.message.includes('parent_id')) {
        return res.status(400).json({
          status: false,
          message: 'Error de validación del contenido padre',
          error: error.message
        });
      }
      
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar contenido del proyecto
  static async updateProjectContent(req, res) {
    try {
      const { contentId } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const contentData = req.body;
      const updatedContent = await Project.updateContent(contentId, contentData);
      
      if (!updatedContent) {
        return res.status(404).json({
          status: false,
          message: 'Contenido no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Contenido actualizado exitosamente',
        data: updatedContent
      });
    } catch (error) {
      console.error('Error al actualizar contenido:', error);
      
      // Manejar errores específicos de validación
      if (error.message.includes('contenido padre') || 
          error.message.includes('parent_id') || 
          error.message.includes('no puede ser padre de sí mismo') ||
          error.message.includes('Contenido no encontrado')) {
        return res.status(400).json({
          status: false,
          message: 'Error de validación del contenido',
          error: error.message
        });
      }
      
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar contenido del proyecto
  static async deleteProjectContent(req, res) {
    try {
      const { contentId } = req.params;
      const result = await Project.deleteContent(contentId);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: 'Contenido no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Contenido eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar contenido:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener estadísticas de proyectos
  static async getProjectStats(req, res) {
    try {
      const allProjects = await Project.findAll();
      
      const stats = {
        total: allProjects.length,
        conTimeboxes: 0,
        sinTimeboxes: 0,
        promedioTimeboxes: 0
      };

      let totalTimeboxes = 0;
      allProjects.forEach(project => {
        if (project.timebox_count > 0) {
          stats.conTimeboxes++;
          totalTimeboxes += project.timebox_count;
        } else {
          stats.sinTimeboxes++;
        }
      });

      stats.promedioTimeboxes = stats.total > 0 ? (totalTimeboxes / stats.total).toFixed(2) : 0;

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

  // Obtener contenido de una carpeta específica
  static async getContentById(req, res) {
    try {
      const { contentId } = req.params;
      const content = await Project.getContentById(contentId);
      
      if (!content) {
        return res.status(404).json({
          status: false,
          message: 'Contenido no encontrado'
        });
      }

      // Obtener el contenido hijo de esta carpeta
      const childContent = await Project.getChildContent(contentId);
      
      res.json({
        status: true,
        message: 'Contenido obtenido exitosamente',
        data: {
          ...content,
          contenido: childContent
        }
      });
    } catch (error) {
      console.error('Error al obtener contenido:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = ProjectController; 