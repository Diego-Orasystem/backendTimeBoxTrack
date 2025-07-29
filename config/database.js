const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'timebox_tracking',
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
  acquireTimeout: 10000,
  timeout: 10000,
  reconnect: true
});

// Función para probar la conexión
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Conexión a MariaDB establecida correctamente');
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con MariaDB:', err.message);
    return false;
  } finally {
    if (conn) conn.release();
  }
}

// Función para ejecutar consultas
async function executeQuery(sql, params = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(sql, params);
    return result;
  } catch (err) {
    console.error('Error ejecutando consulta:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// Función para ejecutar transacciones
async function executeTransaction(queries) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    
    const results = [];
    for (const query of queries) {
      const result = await conn.query(query.sql, query.params || []);
      results.push(result);
    }
    
    await conn.commit();
    return results;
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Error en transacción:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction
}; 