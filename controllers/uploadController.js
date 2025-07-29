const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    
    // Imágenes
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    
    // Videos
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB hardcodeado
  }
});

class UploadController {
  // Subir un archivo
  static async uploadFile(req, res) {
    try {
      // Usar multer para manejar la subida
      upload.single('file')(req, res, async (err) => {
        if (err) {
          console.error('Error en subida de archivo:', err);
          
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              status: false,
              message: 'Archivo demasiado grande',
              error: 'El tamaño del archivo excede el límite permitido'
            });
          }
          
          if (err.message === 'Tipo de archivo no permitido') {
            return res.status(400).json({
              status: false,
              message: 'Tipo de archivo no permitido',
              error: 'El tipo de archivo no está permitido'
            });
          }
          
          return res.status(500).json({
            status: false,
            message: 'Error al subir archivo',
            error: err.message
          });
        }
        
        if (!req.file) {
          return res.status(400).json({
            status: false,
            message: 'No se proporcionó ningún archivo',
            error: 'Se requiere un archivo para subir'
          });
        }
        
        // Crear registro en la tabla adjuntos
        const adjuntoId = uuidv4();
        const fileUrl = `/uploads/${req.file.filename}`;
        
        const sql = `
          INSERT INTO adjuntos (id, tipo, nombre, url, file_size, mime_type)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await executeQuery(sql, [
          adjuntoId,
          UploadController.getFileType(req.file.mimetype),
          req.file.originalname,
          fileUrl,
          req.file.size,
          req.file.mimetype
        ]);
        
        // Obtener el adjunto creado
        const adjuntoSql = 'SELECT * FROM adjuntos WHERE id = ?';
        const [adjunto] = await executeQuery(adjuntoSql, [adjuntoId]);
        
        res.status(201).json({
          status: true,
          message: 'Archivo subido exitosamente',
          data: {
            id: adjunto.id,
            nombre: adjunto.nombre,
            url: adjunto.url,
            tipo: adjunto.tipo,
            file_size: Number(adjunto.file_size),
            mime_type: adjunto.mime_type
          }
        });
      });
    } catch (error) {
      console.error('Error al procesar subida de archivo:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  // Obtener un archivo por ID
  static async getFileById(req, res) {
    try {
      const { id } = req.params;
      
      const sql = 'SELECT * FROM adjuntos WHERE id = ?';
      const [adjunto] = await executeQuery(sql, [id]);
      
      if (!adjunto) {
        return res.status(404).json({
          status: false,
          message: 'Archivo no encontrado',
          error: 'El archivo con el ID especificado no existe'
        });
      }
      
      res.json({
        status: true,
        message: 'Archivo encontrado',
        data: {
          ...adjunto,
          file_size: Number(adjunto.file_size)
        }
      });
    } catch (error) {
      console.error('Error al obtener archivo:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  // Eliminar un archivo
  static async deleteFile(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener información del archivo
      const sql = 'SELECT * FROM adjuntos WHERE id = ?';
      const [adjunto] = await executeQuery(sql, [id]);
      
      if (!adjunto) {
        return res.status(404).json({
          status: false,
          message: 'Archivo no encontrado',
          error: 'El archivo con el ID especificado no existe'
        });
      }
      
      // Eliminar archivo físico
      const filePath = path.join('./uploads', path.basename(adjunto.url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Eliminar registro de la base de datos
      const deleteSql = 'DELETE FROM adjuntos WHERE id = ?';
      await executeQuery(deleteSql, [id]);
      
      res.json({
        status: true,
        message: 'Archivo eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  // Helper para determinar el tipo de archivo basado en MIME type
  static getFileType(mimeType) {
    if (mimeType.startsWith('image/')) {
      return 'Imagen';
    } else if (mimeType.startsWith('video/')) {
      return 'Video';
    } else {
      return 'Documento';
    }
  }
}

module.exports = UploadController; 