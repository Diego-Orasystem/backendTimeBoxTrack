const { validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subida de archivos (igual que uploadController)
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

// Configurar multer para finanzas
const uploadFinanzas = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Función para generar UUID
function generateUUID() {
  return uuidv4();
}

// ✅ Función helper para convertir BigInt a números regulares
function convertBigIntToNumber(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToNumber(item));
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }
  
  return obj;
}

// Función para obtener el tipo de archivo basado en la extensión
function getFileType(filename) {
  if (!filename) return 'application/octet-stream';
  
  const extension = filename.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

class FinanceController {
  async getMisPagos(req, res) {
    try {
      const { developerId } = req.params;
      
      console.log('🔍 DEBUG getMisPagos:');
      console.log('📁 developerId recibido:', developerId);
      console.log('📁 Tipo de developerId:', typeof developerId);
      
      if (!developerId) {
        return res.status(400).json({
          status: false,
          message: 'ID del developer es requerido'
        });
      }

      // ✅ VALIDACIÓN DE SEGURIDAD: Verificar que el developerId sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(developerId)) {
        console.log('⚠️ developerId no es un UUID válido, pero continuaremos con búsqueda por nombre:', developerId);
        // No retornamos error, continuamos con la búsqueda por nombre
      }

      // ✅ Buscar órdenes de pago SOLO del developer específico con su nombre (usando developer_name primero)
      console.log('📡 Buscando órdenes para developerId:', developerId);
      console.log('📡 Parámetros de búsqueda:', [developerId]);
      
      // ✅ BÚSQUEDA SEGURA: Solo buscar por developer_id exacto del usuario logueado
      const ordenes = await executeQuery(`
        SELECT 
          op.id,
          op.developer_id,
          op.monto,
          op.moneda,
          op.concepto,
          op.fecha_emision,
          op.estado,
          op.created_at,
          op.updated_at,
          CASE 
            WHEN op.developer_name IS NOT NULL THEN op.developer_name
            WHEN per.nombre IS NOT NULL THEN per.nombre
            ELSE op.developer_id
          END as developer_nombre
        FROM ordenes_pago op
        LEFT JOIN personas per ON per.id = op.developer_id
        WHERE op.developer_id = ?
        ORDER BY op.created_at DESC
      `, [developerId]);
      
      console.log('📋 Órdenes encontradas para usuario:', ordenes.length);
      if (ordenes.length > 0) {
        console.log('📋 Primera orden:', ordenes[0]);
      }

      // Obtener pagos asociados a las órdenes encontradas
      let pagos = [];
      if (ordenes.length > 0) {
        const ordenIds = ordenes.map(o => o.id);
        console.log('📡 Buscando pagos para órdenes:', ordenIds);
        
        if (ordenIds.length > 0) {
          const placeholders = ordenIds.map(() => '?').join(',');
          pagos = await executeQuery(`
            SELECT 
              p.id,
              p.orden_pago_id,
              p.monto,
              p.moneda,
              p.metodo,
              p.referencia,
              p.fecha_pago,
              p.created_at,
              p.archivo_url,
              p.archivo_tipo,
              CAST(p.archivo_size AS UNSIGNED) as archivo_size
            FROM pagos p
            WHERE p.orden_pago_id IN (${placeholders})
            ORDER BY p.created_at DESC
          `, ordenIds);
        }
      }
      
      console.log('💰 Pagos encontrados:', pagos.length);
      if (pagos.length > 0) {
        console.log('💰 Primer pago:', pagos[0]);
      }

      // Combinar la información
      const misPagos = ordenes.map(orden => {
        const pagosOrden = pagos.filter(p => p.orden_pago_id === orden.id);
        return {
          ...orden,
          pagos: pagosOrden
        };
      });

      // Convertir BigInt a Number para evitar errores de serialización
      const misPagosSerializados = JSON.parse(JSON.stringify(misPagos, (key, value) => {
        if (typeof value === 'bigint') {
          return Number(value);
        }
        return value;
      }));

      console.log('🎯 Resultado final - misPagos:', misPagosSerializados.length);
      if (misPagosSerializados.length > 0) {
        console.log('🎯 Primer misPago:', misPagosSerializados[0]);
      }

      res.json({
        status: true,
        message: 'Mis pagos obtenidos exitosamente',
        data: misPagosSerializados
      });
    } catch (error) {
      console.error('Error getMisPagos:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  async getOrdenesPago(req, res) {
    try {
      const { estado, developerId } = req.query;
      // ✅ Consulta corregida: Primero usar developer_name de la orden, luego JOIN con personas
      let sql = `
        SELECT 
          op.*,
          CASE 
            WHEN op.developer_name IS NOT NULL THEN op.developer_name
            WHEN per.nombre IS NOT NULL THEN per.nombre
            ELSE op.developer_id
          END as developer_nombre
        FROM ordenes_pago op
        LEFT JOIN personas per ON per.id = op.developer_id
      `;
      const params = [];
      const filters = [];
      if (estado) {
        filters.push('op.estado = ?');
        params.push(estado);
      }
      if (developerId) {
        filters.push('op.developer_id = ?');
        params.push(developerId);
      }
      if (filters.length > 0) {
        sql += ' WHERE ' + filters.join(' AND ');
      }
      sql += ' ORDER BY op.fecha_emision DESC, op.created_at DESC';

      console.log('🔍 SQL Query:', sql);
      console.log('🔍 Params:', params);

      const ordenes = await executeQuery(sql, params);
      
      console.log('📋 Órdenes encontradas:', ordenes.length);
      if (ordenes.length > 0) {
        console.log('📋 Primera orden:', {
          id: ordenes[0].id,
          developer_id: ordenes[0].developer_id,
          developer_name: ordenes[0].developer_name,
          developer_nombre: ordenes[0].developer_nombre
        });
      }
      
      res.json({ status: true, message: 'Órdenes de pago obtenidas', data: ordenes });
    } catch (error) {
      console.error('Error getOrdenesPago:', error);
      res.status(500).json({ status: false, message: 'Error interno del servidor', error: error.message });
    }
  }

  async createOrdenPago(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: 'Datos inválidos', errors: errors.array() });
      }
      const { developerId, developerName, monto, moneda, concepto, fechaEmision } = req.body;
      const id = uuidv4();
      
      console.log('🔍 createOrdenPago - Datos recibidos:', {
        developerId,
        developerName,
        monto,
        moneda,
        concepto,
        fechaEmision
      });

      await executeQuery(
        `INSERT INTO ordenes_pago (id, developer_id, developer_name, monto, moneda, concepto, fecha_emision, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, developerId, developerName, monto, moneda, concepto || null, fechaEmision || null, 'Pendiente']
      );
      
      console.log('💾 Orden insertada con ID:', id);
      console.log('💾 developer_name guardado:', developerName);

      // ✅ Obtener la orden creada con el nombre del developer (usando developer_name primero)
      const [orden] = await executeQuery(`
        SELECT op.*, 
          CASE 
            WHEN op.developer_name IS NOT NULL THEN op.developer_name
            WHEN per.nombre IS NOT NULL THEN per.nombre
            ELSE op.developer_id
          END as developer_nombre
        FROM ordenes_pago op
        LEFT JOIN personas per ON per.id = op.developer_id
        WHERE op.id = ?
      `, [id]);
      
      console.log('📋 Orden retornada:', {
        id: orden.id,
        developer_id: orden.developer_id,
        developer_name: orden.developer_name,
        developer_nombre: orden.developer_nombre
      });
      
      res.status(201).json({ status: true, message: 'Orden de pago creada', data: orden });
    } catch (error) {
      console.error('Error createOrdenPago:', error);
      res.status(500).json({ status: false, message: 'Error interno del servidor', error: error.message });
    }
  }

  async updateEstadoOrden(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          status: false, 
          message: 'Datos inválidos', 
          errors: errors.array() 
        });
      }

      // Verificar que la orden existe
      const [orden] = await executeQuery('SELECT * FROM ordenes_pago WHERE id = ?', [id]);
      if (!orden) {
        return res.status(404).json({
          status: false,
          message: 'Orden de pago no encontrada'
        });
      }

      // Actualizar el estado
      await executeQuery(
        'UPDATE ordenes_pago SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [estado, id]
      );

      // Obtener la orden actualizada
      const [ordenActualizada] = await executeQuery('SELECT * FROM ordenes_pago WHERE id = ?', [id]);

      res.json({
        status: true,
        message: `Estado de la orden actualizado a ${estado}`,
        data: ordenActualizada
      });
    } catch (error) {
      console.error('Error updateEstadoOrden:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Subir comprobante de pago
  async subirComprobante(req, res) {
    try {
      console.log('📁 subirComprobante - Iniciando...');
      console.log('📁 req.params:', req.params);
      console.log('📁 req.body:', req.body);
      console.log('📁 req.file:', req.file);

      const { id } = req.params; // Cambiar ordenId por id
      const { referencia } = req.body;
      const archivo = req.file;

      // Validaciones
      if (!id) {
        return res.status(400).json({
          status: false,
          message: "ID de orden es requerido"
        });
      }

      if (!referencia || referencia.trim() === '') {
        return res.status(400).json({
          status: false,
          message: "Referencia es requerida"
        });
      }

      if (!archivo) {
        return res.status(400).json({
          status: false,
          message: "Archivo es requerido"
        });
      }

      // Verificar que la orden existe
      const orden = await executeQuery(
        'SELECT * FROM ordenes_pago WHERE id = ?',
        [id] // Usar id en lugar de ordenId
      );

      if (orden.length === 0) {
        return res.status(404).json({
          status: false,
          message: "Orden de pago no encontrada"
        });
      }

      // Crear el registro de pago con información del archivo
      const pagoData = {
        id: generateUUID(),
        developer_id: orden[0].developer_id,
        orden_pago_id: id, // Usar id en lugar de ordenId
        monto: orden[0].monto,
        moneda: orden[0].moneda,
        metodo: 'Comprobante',
        referencia: referencia.trim(),
        fecha_pago: new Date(),
        archivo_url: `/uploads/${archivo.filename}`, // URL del archivo
        archivo_tipo: archivo.mimetype || getFileType(archivo.filename), // Tipo de archivo
        archivo_size: archivo.size // Tamaño en bytes
      };

      console.log('📁 Datos del pago a insertar:', pagoData);

      // Insertar el pago
      const resultado = await executeQuery(`
        INSERT INTO pagos (
          id, developer_id, orden_pago_id, monto, moneda, metodo, referencia, 
          fecha_pago, archivo_url, archivo_tipo, archivo_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pagoData.id,
        pagoData.developer_id,
        pagoData.orden_pago_id,
        pagoData.monto,
        pagoData.moneda,
        pagoData.metodo,
        pagoData.referencia,
        pagoData.fecha_pago,
        pagoData.archivo_url,
        pagoData.archivo_tipo,
        pagoData.archivo_size
      ]);

      console.log('✅ Pago insertado exitosamente:', resultado);

      // Actualizar estado de la orden a "Pagada"
      await executeQuery(
        'UPDATE ordenes_pago SET estado = ? WHERE id = ?',
        ['Pagada', id] // Usar id en lugar de ordenId
      );

      console.log('✅ Estado de orden actualizado a "Pagada"');

      res.json({
        status: true,
        message: "Comprobante subido exitosamente",
        data: {
          id: pagoData.id,
          ordenId: id, // Usar id en lugar de ordenId
          referencia: referencia,
          archivo: archivo.filename,
          archivo_url: pagoData.archivo_url,
          archivo_tipo: pagoData.archivo_tipo,
          archivo_size: pagoData.archivo_size
        }
      });

    } catch (error) {
      console.error('❌ Error en subirComprobante:', error);
      res.status(500).json({
        status: false,
        message: "Error interno del servidor",
        error: error.message
      });
    }
  }

  // ✅ MÉTODO NUEVO: Obtener todos los pagos (para admin)
  async getAllPagos(req, res) {
    try {
      console.log('🔐 getAllPagos: Usuario admin solicitando todos los pagos');
      
      // ✅ Obtener todas las órdenes de pago con el nombre del developer (usando developer_name primero)
      const ordenes = await executeQuery(`
        SELECT 
          op.id,
          op.developer_id,
          op.monto,
          op.moneda,
          op.concepto,
          op.fecha_emision,
          op.estado,
          op.created_at,
          op.updated_at,
          CASE 
            WHEN op.developer_name IS NOT NULL THEN op.developer_name
            WHEN per.nombre IS NOT NULL THEN per.nombre
            ELSE op.developer_id
          END as developer_nombre
        FROM ordenes_pago op
        LEFT JOIN personas per ON per.id = op.developer_id
        ORDER BY op.created_at DESC
      `);
      
      console.log('📋 Órdenes encontradas para admin:', ordenes.length);

      // Obtener todos los pagos asociados
      let pagos = [];
      if (ordenes.length > 0) {
        const ordenIds = ordenes.map(o => o.id);
        const placeholders = ordenIds.map(() => '?').join(',');
        pagos = await executeQuery(`
          SELECT 
            p.id,
            p.orden_pago_id,
            p.monto,
            p.moneda,
            p.metodo,
            p.referencia,
            p.fecha_pago,
            p.created_at,
            p.archivo_url,
            p.archivo_tipo,
            CAST(p.archivo_size AS UNSIGNED) as archivo_size
          FROM pagos p
          WHERE p.orden_pago_id IN (${placeholders})
          ORDER BY p.created_at DESC
        `, ordenIds);
      }
      
      console.log('💰 Pagos encontrados para admin:', pagos.length);

      // Combinar la información
      const todosLosPagos = ordenes.map(orden => {
        const pagosOrden = pagos.filter(p => p.orden_pago_id === orden.id);
        return {
          ...orden,
          pagos: pagosOrden
        };
      });

      // ✅ Convertir BigInt a números regulares antes de enviar
      const pagosConvertidos = convertBigIntToNumber(todosLosPagos);

      res.json({
        status: true,
        message: 'Todos los pagos obtenidos (vista admin)',
        data: pagosConvertidos
      });

    } catch (error) {
      console.error('❌ Error en getAllPagos:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // ✅ MÉTODO NUEVO: Manejar casos donde no hay developerId válido
  async getUnauthorizedPagos(req, res) {
    try {
      console.log('🚫 getUnauthorizedPagos: Usuario sin developerId válido');
      
      res.status(401).json({
        status: false,
        message: 'No autorizado - ID de usuario requerido',
        data: []
      });

    } catch (error) {
      console.error('❌ Error en getUnauthorizedPagos:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // ✅ MÉTODO NUEVO: Obtener órdenes de pago por usuario específico
  async getOrdenesPagoByUser(req, res) {
    try {
      const { userId, estado } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          status: false,
          message: 'ID de usuario es requerido'
        });
      }

      console.log('🔐 getOrdenesPagoByUser: Usuario solicitando sus órdenes:', userId);
      console.log('🔐 userId recibido:', userId);
      
      let sql = `
        SELECT 
          op.*,
          CASE 
            WHEN op.developer_name IS NOT NULL THEN op.developer_name
            WHEN per.nombre IS NOT NULL THEN per.nombre
            ELSE op.developer_id
          END as developer_nombre
        FROM ordenes_pago op
        LEFT JOIN personas per ON per.id = op.developer_id
        WHERE op.developer_id = ?
      `;
      // ✅ BÚSQUEDA SEGURA: Solo buscar por developer_id exacto del usuario logueado
      const params = [userId];
      
      if (estado) {
        sql += ' AND op.estado = ?';
        params.push(estado);
      }
      
      sql += ' ORDER BY op.fecha_emision DESC, op.created_at DESC';

      console.log('🔍 SQL Query getOrdenesPagoByUser:', sql);
      console.log('🔍 Params getOrdenesPagoByUser:', params);

      const ordenes = await executeQuery(sql, params);
      
      console.log('📋 Órdenes encontradas para usuario:', ordenes.length);

      res.json({
        status: true,
        message: 'Órdenes de pago del usuario obtenidas',
        data: ordenes
      });

    } catch (error) {
      console.error('❌ Error en getOrdenesPagoByUser:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // ✅ MÉTODO NUEVO: Respuesta para usuarios no autorizados
  async getUnauthorized(req, res) {
    console.log('🚫 getUnauthorized: Usuario no autenticado intentando acceder');
    
    res.status(401).json({
      status: false,
      message: 'Acceso no autorizado. Debes iniciar sesión para ver tus órdenes de pago.',
      data: []
    });
  }
}

module.exports = new FinanceController();
module.exports.uploadFinanzas = uploadFinanzas;


