const mysql = require('mysql2/promise');

// Configuración de la base de datos (ajustar según tu configuración)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'timebox_db'
};

async function testFinanzas() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa');

    // 1. Verificar que las tablas existen
    console.log('\n📋 Verificando tablas de finanzas...');
    
    const [tables] = await connection.execute('SHOW TABLES LIKE "%finanza%"');
    console.log('Tablas de finanzas:', tables);
    
    const [pagoTables] = await connection.execute('SHOW TABLES LIKE "%pago%"');
    console.log('Tablas de pagos:', pagoTables);
    
    const [ordenTables] = await connection.execute('SHOW TABLES LIKE "%orden%"');
    console.log('Tablas de órdenes:', ordenTables);

    // 2. Verificar estructura de kickoff_phases
    console.log('\n🔍 Verificando estructura de kickoff_phases...');
    const [columns] = await connection.execute('DESCRIBE kickoff_phases');
    const hasFinanciamiento = columns.some(col => col.Field === 'financiamiento');
    const hasCompensacion = columns.some(col => col.Field === 'compensacion_economica');
    
    console.log('Columna financiamiento:', hasFinanciamiento ? '✅ Existe' : '❌ No existe');
    console.log('Columna compensacion_economica:', hasCompensacion ? '✅ Existe' : '❌ No existe');

    // 3. Verificar datos de financiamiento en timeboxes existentes
    console.log('\n💰 Verificando datos de financiamiento...');
    const [financiamientoData] = await connection.execute(`
      SELECT 
        t.id,
        t.estado,
        kp.financiamiento,
        kp.compensacion_economica
      FROM timeboxes t
      LEFT JOIN kickoff_phases kp ON t.id = kp.timebox_id
      WHERE kp.financiamiento IS NOT NULL
      LIMIT 5
    `);
    
    console.log('Timeboxes con financiamiento:', financiamientoData.length);
    financiamientoData.forEach(tb => {
      console.log(`  - ID: ${tb.id}, Estado: ${tb.estado}`);
      if (tb.financiamiento) {
        try {
          const fin = JSON.parse(tb.financiamiento);
          console.log(`    Financiamiento: ${fin.montoBase} ${fin.moneda} (${fin.porcentajeAnticipado}% anticipo)`);
        } catch (e) {
          console.log(`    Financiamiento: Error parseando JSON`);
        }
      }
    });

    // 4. Verificar si hay órdenes de pago existentes
    console.log('\n📄 Verificando órdenes de pago existentes...');
    try {
      const [ordenes] = await connection.execute('SELECT COUNT(*) as total FROM ordenes_pago');
      console.log('Total de órdenes de pago:', ordenes[0].total);
    } catch (error) {
      console.log('❌ Tabla ordenes_pago no existe o hay error:', error.message);
    }

    // 5. Verificar si hay pagos existentes
    console.log('\n💳 Verificando pagos existentes...');
    try {
      const [pagos] = await connection.execute('SELECT COUNT(*) as total FROM pagos');
      console.log('Total de pagos:', pagos[0].total);
    } catch (error) {
      console.log('❌ Tabla pagos no existe o hay error:', error.message);
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la prueba
console.log('🚀 Iniciando prueba de funcionalidad de finanzas...\n');
testFinanzas().then(() => {
  console.log('\n✅ Prueba completada');
}).catch(error => {
  console.error('\n❌ Error en la prueba:', error);
});
