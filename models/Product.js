const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Product {
  static async findAll() {
    const sql = `
      SELECT p.*, pe.nombre as nombreResponsable 
      FROM product p
      LEFT JOIN personas pe ON p.idResponsable COLLATE utf8mb4_general_ci = pe.id COLLATE utf8mb4_general_ci
      WHERE p.estado = 'vigente'
      ORDER BY p.fechaCreacion DESC
    `;
    return await executeQuery(sql);
  }

  static async findById(id) {
    const sql = `
      SELECT p.*, pe.nombre as nombreResponsable 
      FROM product p
      LEFT JOIN personas pe ON p.idResponsable COLLATE utf8mb4_general_ci = pe.id COLLATE utf8mb4_general_ci
      WHERE p.id = ? AND p.estado = 'vigente'
    `;
    const result = await executeQuery(sql, [id]);
    return result[0];
  }

  static async create(productData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO product (id, nombre, idResponsable, estado, fechaCreacion, descripcion)
      VALUES (?, ?, ?, 'vigente', NOW(), ?)
    `;
    await executeQuery(sql, [
      id,
      productData.nombre,
      productData.idResponsable,
      productData.descripcion
    ]);

    return this.findById(id);
  }

  static async update(id, productData) {
    const sql = `
      UPDATE product 
      SET nombre = ?, idResponsable = ?, descripcion = ?
      WHERE id = ? AND estado = 'vigente'
    `;
    
    await executeQuery(sql, [
      productData.nombre,
      productData.idResponsable,
      productData.descripcion,
      id
    ]);

    return this.findById(id);
  }

  static async delete(id) {
    const sql = `
      UPDATE product 
      SET estado = 'eliminado'
      WHERE id = ?
    `;
    return await executeQuery(sql, [id]);
  }

  static async findByResponsable(idResponsable) {
    const sql = `
      SELECT p.*, pe.nombre as nombreResponsable 
      FROM product p
      LEFT JOIN personas pe ON p.idResponsable COLLATE utf8mb4_general_ci = pe.id COLLATE utf8mb4_general_ci
      WHERE p.idResponsable = ? AND p.estado = 'vigente'
      ORDER BY p.fechaCreacion DESC
    `;
    return await executeQuery(sql, [idResponsable]);
  }

  static async searchByName(name) {
    const sql = `
      SELECT p.*, pe.nombre as nombreResponsable 
      FROM product p
      LEFT JOIN personas pe ON p.idResponsable COLLATE utf8mb4_general_ci = pe.id COLLATE utf8mb4_general_ci
      WHERE p.nombre LIKE ? AND p.estado = 'vigente'
      ORDER BY p.nombre ASC
    `;
    return await executeQuery(sql, [`%${name}%`]);
  }
  
  static async getEntregablesDetailsByProduct(productId) {
    const sql = `
      SELECT e.*, p.nombre as nombreProducto
      FROM entregable e
      LEFT JOIN product p ON e.productId = p.id
      WHERE e.productId = ? AND e.estado = 'vigente'
      ORDER BY e.fechaCreacion DESC
    `;
    return await executeQuery(sql, [productId]);
  }
}

module.exports = Product;