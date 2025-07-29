const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Project {
  static async findAll() {
    const sql = `
      SELECT 
        p.*,
        COUNT(t.id) as timebox_count
      FROM projects p
      LEFT JOIN timeboxes t ON p.id = t.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    const results = await executeQuery(sql);
    // Convertir BigInt a Number para evitar problemas de serialización
    return results.map(row => ({
      ...row,
      timebox_count: Number(row.timebox_count)
    }));
  }

  static async findById(id) {
    const sql = `
      SELECT 
        p.*,
        COUNT(t.id) as timebox_count
      FROM projects p
      LEFT JOIN timeboxes t ON p.id = t.project_id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    const result = await executeQuery(sql, [id]);
    if (result[0]) {
      // Convertir BigInt a Number para evitar problemas de serialización
      return {
        ...result[0],
        timebox_count: Number(result[0].timebox_count)
      };
    }
    return result[0];
  }

  static async create(projectData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO projects (id, nombre, descripcion)
      VALUES (?, ?, ?)
    `;
    
    await executeQuery(sql, [
      id,
      projectData.nombre,
      projectData.descripcion || null
    ]);

    return this.findById(id);
  }

  static async update(id, projectData) {
    const sql = `
      UPDATE projects 
      SET nombre = ?, descripcion = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(sql, [
      projectData.nombre,
      projectData.descripcion || null,
      id
    ]);

    return this.findById(id);
  }

  static async delete(id) {
    const sql = 'DELETE FROM projects WHERE id = ?';
    return await executeQuery(sql, [id]);
  }

  static async getWithContent(id) {
    const project = await this.findById(id);
    if (!project) return null;

    // Obtener contenido del proyecto
    const contentSql = `
      SELECT 
        pc.*,
        a.nombre as adjunto_nombre,
        a.url as adjunto_url,
        a.tipo as adjunto_tipo
      FROM project_content pc
      LEFT JOIN adjuntos a ON pc.adjunto_id = a.id
      WHERE pc.project_id = ?
      ORDER BY pc.created_at ASC
    `;
    const content = await executeQuery(contentSql, [id]);

    // Organizar contenido en estructura jerárquica
    const contentMap = new Map();
    const rootContent = [];

    // Primero, mapear todo el contenido
    content.forEach(item => {
      // Crear objeto de adjunto si existe
      let adjunto = null;
      if (item.adjunto_nombre && item.adjunto_url) {
        adjunto = {
          nombre: item.adjunto_nombre,
          url: item.adjunto_url,
          type: item.adjunto_tipo
        };
      }
      
      contentMap.set(item.id, { 
        ...item, 
        contenido: [],
        adjunto: adjunto
      });
    });

    // Luego, organizar en jerarquía
    content.forEach(item => {
      if (item.parent_id) {
        const parent = contentMap.get(item.parent_id);
        if (parent) {
          parent.contenido.push(contentMap.get(item.id));
        }
      } else {
        rootContent.push(contentMap.get(item.id));
      }
    });

    return {
      ...project,
      contenido: rootContent
    };
  }

  static async addContent(projectId, contentData) {
    // Validar que el parent_id existe si se proporciona
    if (contentData.parentId) {
      const parentExists = await this.getContentById(contentData.parentId);
      if (!parentExists) {
        throw new Error(`El contenido padre con ID ${contentData.parentId} no existe`);
      }
      
      // Validar que el parent pertenece al mismo proyecto
      if (parentExists.project_id !== projectId) {
        throw new Error('El contenido padre debe pertenecer al mismo proyecto');
      }
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO project_content (id, project_id, nombre, tipo, descripcion, parent_id, adjunto_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(sql, [
      id,
      projectId,
      contentData.nombre,
      contentData.tipo,
      contentData.descripcion || null,
      contentData.parentId || null,
      contentData.adjuntoId || null
    ]);

    return this.getContentById(id);
  }

  static async getContentById(contentId) {
    const sql = `
      SELECT 
        pc.*,
        a.nombre as adjunto_nombre,
        a.url as adjunto_url,
        a.tipo as adjunto_tipo
      FROM project_content pc
      LEFT JOIN adjuntos a ON pc.adjunto_id = a.id
      WHERE pc.id = ?
    `;
    const result = await executeQuery(sql, [contentId]);
    
    if (result[0]) {
      const item = result[0];
      // Crear objeto de adjunto si existe
      let adjunto = null;
      if (item.adjunto_nombre && item.adjunto_url) {
        adjunto = {
          nombre: item.adjunto_nombre,
          url: item.adjunto_url,
          type: item.adjunto_tipo
        };
      }
      
      return {
        ...item,
        adjunto: adjunto
      };
    }
    
    return result[0];
  }

  static async updateContent(contentId, contentData) {
    // Obtener el contenido actual para validar el proyecto
    const currentContent = await this.getContentById(contentId);
    if (!currentContent) {
      throw new Error('Contenido no encontrado');
    }

    // Validar que el parent_id existe si se proporciona
    if (contentData.parentId) {
      const parentExists = await this.getContentById(contentData.parentId);
      if (!parentExists) {
        throw new Error(`El contenido padre con ID ${contentData.parentId} no existe`);
      }
      
      // Validar que el parent pertenece al mismo proyecto
      if (parentExists.project_id !== currentContent.project_id) {
        throw new Error('El contenido padre debe pertenecer al mismo proyecto');
      }
      
      // Validar que no se está intentando hacer un elemento padre de sí mismo
      if (contentData.parentId === contentId) {
        throw new Error('Un elemento no puede ser padre de sí mismo');
      }
    }

    const sql = `
      UPDATE project_content 
      SET nombre = ?, tipo = ?, descripcion = ?, parent_id = ?, adjunto_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(sql, [
      contentData.nombre,
      contentData.tipo,
      contentData.descripcion || null,
      contentData.parentId || null,
      contentData.adjuntoId || null,
      contentId
    ]);

    return this.getContentById(contentId);
  }

  static async deleteContent(contentId) {
    const sql = 'DELETE FROM project_content WHERE id = ?';
    return await executeQuery(sql, [contentId]);
  }

  static async getChildContent(parentId) {
    console.log('getChildContent llamado con parentId:', parentId);
    const sql = `
      SELECT 
        pc.*,
        a.nombre as adjunto_nombre,
        a.url as adjunto_url,
        a.tipo as adjunto_tipo
      FROM project_content pc
      LEFT JOIN adjuntos a ON pc.adjunto_id = a.id
      WHERE pc.parent_id = ?
      ORDER BY pc.created_at ASC
    `;
    const content = await executeQuery(sql, [parentId]);
    console.log('Contenido obtenido de la base de datos:', content);

    // Simplificar: devolver directamente el contenido sin organización jerárquica
    const result = content.map(item => {
      // Crear objeto de adjunto si existe
      let adjunto = null;
      if (item.adjunto_nombre && item.adjunto_url) {
        adjunto = {
          nombre: item.adjunto_nombre,
          url: item.adjunto_url,
          type: item.adjunto_tipo
        };
      }
      
      return { 
        ...item, 
        contenido: [],
        adjunto: adjunto
      };
    });
    console.log('Contenido final devuelto:', result);
    return result;
  }
}

module.exports = Project; 