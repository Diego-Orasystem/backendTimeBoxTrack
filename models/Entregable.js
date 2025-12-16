const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Entregable {
  static async findAll() {
    const sql = `
      SELECT e.*, p.nombre as nombreProducto 
      FROM entregable e
      LEFT JOIN product p ON e.productId = p.id
      WHERE e.estado = 'vigente'
      ORDER BY e.fechaCreacion DESC
    `;
    return await executeQuery(sql);
  }

  static async findById(id) {
    const sql = `
      SELECT e.*, p.nombre as nombreProducto 
      FROM entregable e
      LEFT JOIN product p ON e.productId = p.id
      WHERE e.id = ? AND e.estado = 'vigente'
    `;
    const result = await executeQuery(sql, [id]);
    return result[0];
  }

  static async create(entregableData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO entregable (id, productId, tipo, nombre, descripcion, entregableId, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'vigente')
    `;
    
    await executeQuery(sql, [
      id,
      entregableData.productId,
      entregableData.tipo,
      entregableData.nombre,
      entregableData.descripcion,
      entregableData.entregableId || null
    ]);

    return this.findById(id);
  }

  static async update(id, entregableData) {
    const sql = `
      UPDATE entregable 
      SET productId = ?, tipo = ?, nombre = ?, descripcion = ?, entregableId = ?
      WHERE id = ? AND estado = 'vigente'
    `;
    
    await executeQuery(sql, [
      entregableData.productId,
      entregableData.tipo,
      entregableData.nombre,
      entregableData.descripcion,
      entregableData.entregableId || null,
      id
    ]);

    return this.findById(id);
  }

  static async delete(id) {
    const sql = `
      UPDATE entregable 
      SET estado = 'eliminado'
      WHERE id = ?
    `;
    return await executeQuery(sql, [id]);
  }

  static async findByProduct(productId) {
    const sql = `
      SELECT e.*, p.nombre as nombreProducto 
      FROM entregable e
      LEFT JOIN product p ON e.productId = p.id
      WHERE e.productId = ? AND e.estado = 'vigente'
      ORDER BY e.fechaCreacion DESC
    `;
    return await executeQuery(sql, [productId]);
  }

  static async findByTipo(tipo) {
    const sql = `
      SELECT e.*, p.nombre as nombreProducto 
      FROM entregable e
      LEFT JOIN product p ON e.productId = p.id
      WHERE e.tipo = ? AND e.estado = 'vigente'
      ORDER BY e.fechaCreacion DESC
    `;
    return await executeQuery(sql, [tipo]);
  }

  static async searchByName(name) {
    const sql = `
      SELECT e.*, p.nombre as nombreProducto 
      FROM entregable e
      LEFT JOIN product p ON e.productId = p.id
      WHERE e.nombre LIKE ? AND e.estado = 'vigente'
      ORDER BY e.nombre ASC
    `;
    return await executeQuery(sql, [`%${name}%`]);
  }

  static async findByEntregableId(entregableId) {
    const sql = `
      SELECT e.*, p.nombre as nombreProducto 
      FROM entregable e
      LEFT JOIN product p ON e.productId = p.id
      WHERE e.entregableId = ? AND e.estado = 'vigente'
      ORDER BY e.fechaCreacion DESC
    `;
    return await executeQuery(sql, [entregableId]);
  }

  static async getAllTipos() {
    const sql = `
      SELECT DISTINCT tipo 
      FROM entregable 
      WHERE estado = 'vigente'
      ORDER BY tipo ASC
    `;
    const result = await executeQuery(sql);
    return result.map(row => row.tipo);
  }
}

module.exports = Entregable;