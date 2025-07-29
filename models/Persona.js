const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Persona {
  static async findAll() {
    const sql = `
      SELECT * FROM personas 
      ORDER BY nombre ASC
    `;
    return await executeQuery(sql);
  }

  static async findById(id) {
    const sql = `
      SELECT * FROM personas WHERE id = ?
    `;
    const result = await executeQuery(sql, [id]);
    return result[0];
  }

  static async findByRol(rol) {
    const sql = `
      SELECT * FROM personas 
      WHERE rol = ?
      ORDER BY nombre ASC
    `;
    return await executeQuery(sql, [rol]);
  }

  static async create(personaData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO personas (id, nombre, rol, email, habilidades)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await executeQuery(sql, [
      id,
      personaData.nombre,
      personaData.rol || null,
      personaData.email || null,
      personaData.habilidades ? JSON.stringify(personaData.habilidades) : null
    ]);

    return this.findById(id);
  }

  static async update(id, personaData) {
    const sql = `
      UPDATE personas 
      SET nombre = ?, rol = ?, email = ?, habilidades = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(sql, [
      personaData.nombre,
      personaData.rol || null,
      personaData.email || null,
      personaData.habilidades ? JSON.stringify(personaData.habilidades) : null,
      id
    ]);

    return this.findById(id);
  }

  static async delete(id) {
    const sql = 'DELETE FROM personas WHERE id = ?';
    return await executeQuery(sql, [id]);
  }

  static async searchByName(name) {
    const sql = `
      SELECT * FROM personas 
      WHERE nombre LIKE ?
      ORDER BY nombre ASC
    `;
    return await executeQuery(sql, [`%${name}%`]);
  }

  static async getByHabilidades(habilidades) {
    const sql = `
      SELECT * FROM personas 
      WHERE JSON_CONTAINS(habilidades, ?)
      ORDER BY nombre ASC
    `;
    return await executeQuery(sql, [JSON.stringify(habilidades)]);
  }

  static async getTeamLeaders() {
    return await this.findByRol('Team Leader');
  }

  static async getBusinessAnalysts() {
    return await this.findByRol('Business Analyst');
  }

  static async getDevelopers() {
    return await this.findByRol('Developer');
  }

  static async getTesters() {
    return await this.findByRol('Tester');
  }
}

module.exports = Persona; 