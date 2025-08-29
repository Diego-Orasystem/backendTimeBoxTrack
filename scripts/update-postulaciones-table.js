const mariadb = require('mariadb');
require('dotenv').config();

async function updatePostulacionesTable() {
  let connection;

  try {
    connection = await mariadb.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'timebox_track'
    });

    console.log('🔌 Conectado a la base de datos');

    // Verificar si los campos ya existen
    const columns = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'postulaciones'
      AND COLUMN_NAME IN ('motivo_rechazo', 'fecha_rechazo')
    `, [process.env.DB_NAME || 'timebox_track']);

    console.log('🔍 Campos encontrados:', columns);

    if (columns && columns.length === 2) {
      console.log('✅ Los campos motivo_rechazo y fecha_rechazo ya existen');
      return;
    }

    // Agregar campos para el rechazo de postulaciones
    console.log('🔧 Agregando campos para el rechazo de postulaciones...');
    
    await connection.query(`
      ALTER TABLE postulaciones 
      ADD COLUMN motivo_rechazo TEXT NULL COMMENT 'Motivo del rechazo de la postulación'
    `);
    console.log('✅ Campo motivo_rechazo agregado');

    await connection.query(`
      ALTER TABLE postulaciones 
      ADD COLUMN fecha_rechazo DATE NULL COMMENT 'Fecha en que se rechazó la postulación'
    `);
    console.log('✅ Campo fecha_rechazo agregado');

    // Verificar que los campos se agregaron correctamente
    const updatedColumns = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'postulaciones'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'timebox_track']);

    console.log('\n📋 Estructura actualizada de la tabla postulaciones:');
    updatedColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) - ${col.COLUMN_COMMENT || 'Sin comentario'}`);
    });

    console.log('\n🎉 Tabla postulaciones actualizada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('💡 Algunos campos ya existen en la tabla');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

updatePostulacionesTable();
