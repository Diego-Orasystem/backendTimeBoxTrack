const mariadb = require('mariadb');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'timebox_tracking',
  connectionLimit: 10,
  acquireTimeout: 10000,
  timeout: 10000,
  reconnect: true
};

const pool = mariadb.createPool(dbConfig);

// Función para mostrar configuración de forma segura
function logDatabaseConfig() {
  console.log('🔧 Variables de configuración de base de datos:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   Contraseña: ${'*'.repeat(dbConfig.password.length)}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Límite de conexiones: ${dbConfig.connectionLimit}`);
  console.log(`   Timeout de adquisición: ${dbConfig.acquireTimeout}ms`);
  console.log(`   Timeout general: ${dbConfig.timeout}ms`);
  console.log(`   Reconexión automática: ${dbConfig.reconnect ? 'Sí' : 'No'}`);
}

// Función para probar la conexión
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Conexión a MariaDB establecida correctamente');
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con MariaDB:', err.message);
    console.error('📋 Detalles del error:', err);
    logDatabaseConfig();
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
    console.error('🔧 Configuración de base de datos en el momento del error:');
    logDatabaseConfig();
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
    console.error('🔧 Configuración de base de datos en el momento del error:');
    logDatabaseConfig();
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