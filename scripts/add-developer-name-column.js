const { executeQuery } = require('../config/database');

/**
 * Script para agregar la columna developer_name a la tabla ordenes_pago
 * Esta columna almacenará el nombre del developer cuando no esté en la tabla personas
 */

async function addDeveloperNameColumn() {
  try {
    console.log('🔧 Agregando columna developer_name a ordenes_pago...\n');

    // 1. Verificar si la columna ya existe
    console.log('🔍 1. Verificando si la columna developer_name ya existe...');
    const columns = await executeQuery(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'ordenes_pago' 
      AND COLUMN_NAME = 'developer_name'
    `);

    if (columns.length > 0) {
      console.log('✅ La columna developer_name ya existe en la tabla ordenes_pago');
      return;
    }

    // 2. Agregar la columna developer_name
    console.log('🔧 2. Agregando columna developer_name...');
    await executeQuery(`
      ALTER TABLE ordenes_pago 
      ADD COLUMN developer_name VARCHAR(255) NULL
    `);
    console.log('✅ Columna developer_name agregada exitosamente');

    // 3. Agregar índice para mejorar el rendimiento
    console.log('🔧 3. Agregando índice para developer_name...');
    try {
      await executeQuery(`
        CREATE INDEX idx_op_dev_name ON ordenes_pago (developer_name)
      `);
      console.log('✅ Índice idx_op_dev_name creado exitosamente');
    } catch (error) {
      console.log('⚠️ El índice ya existe o no se pudo crear:', error.message);
    }

    // 4. Verificar la estructura final
    console.log('🔍 4. Verificando estructura final de la tabla...');
    const tableStructure = await executeQuery(`
      DESCRIBE ordenes_pago
    `);

    console.log('\n📋 Estructura actual de la tabla ordenes_pago:');
    tableStructure.forEach(column => {
      console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n✅ Script completado exitosamente!');
    console.log('\n📝 Resumen de cambios:');
    console.log('   - Columna developer_name agregada a ordenes_pago');
    console.log('   - Índice idx_op_dev_name creado');
    console.log('   - La tabla ahora puede almacenar nombres de developers directamente');

  } catch (error) {
    console.error('❌ Error durante la ejecución:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
addDeveloperNameColumn();
