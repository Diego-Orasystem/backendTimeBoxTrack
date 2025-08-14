const { executeQuery } = require('./config/database');

async function testMisPagos() {
  try {
    console.log('🧪 TEST MIS PAGOS - Probando lógica de búsqueda...\n');

    const developerId = 'c4ec45fc-1939-43c6-9d4b-2be658567c79';
    console.log('📁 DeveloperId a probar:', developerId);

    // 1. Buscar órdenes por UUID exacto
    console.log('\n📋 1. Buscando órdenes por UUID exacto...');
    const ordenesExacto = await executeQuery(`
      SELECT * FROM ordenes_pago 
      WHERE developer_id = ?
    `, [developerId]);
    console.log('Órdenes encontradas (UUID exacto):', ordenesExacto.length);

    // 2. Buscar órdenes por nombre "Juan Pérez"
    console.log('\n📋 2. Buscando órdenes por nombre "Juan Pérez"...');
    const ordenesNombre = await executeQuery(`
      SELECT * FROM ordenes_pago 
      WHERE developer_id = 'Juan Pérez'
    `);
    console.log('Órdenes encontradas (nombre):', ordenesNombre.length);
    if (ordenesNombre.length > 0) {
      console.log('Primera orden:', ordenesNombre[0]);
    }

    // 3. Buscar órdenes por LIKE
    console.log('\n📋 3. Buscando órdenes por LIKE...');
    const ordenesLike = await executeQuery(`
      SELECT * FROM ordenes_pago 
      WHERE developer_id LIKE '%Juan%' OR developer_id LIKE '%Pérez%'
    `);
    console.log('Órdenes encontradas (LIKE):', ordenesLike.length);

    // 4. Buscar pagos para las órdenes encontradas
    if (ordenesNombre.length > 0) {
      console.log('\n💰 4. Buscando pagos para las órdenes...');
      const ordenIds = ordenesNombre.map(o => o.id);
      const placeholders = ordenIds.map(() => '?').join(',');
      
      const pagos = await executeQuery(`
        SELECT * FROM pagos 
        WHERE orden_pago_id IN (${placeholders})
      `, ordenIds);
      
      console.log('Pagos encontrados:', pagos.length);
      if (pagos.length > 0) {
        console.log('Primer pago:', pagos[0]);
      }
    }

    // 5. Verificar si hay pagos en la tabla
    console.log('\n💰 5. Verificando tabla pagos...');
    const totalPagos = await executeQuery('SELECT COUNT(*) as total FROM pagos');
    console.log('Total de pagos en la tabla:', totalPagos[0].total);

    if (totalPagos[0].total > 0) {
      const muestraPagos = await executeQuery('SELECT * FROM pagos LIMIT 3');
      console.log('Muestra de pagos:', muestraPagos);
    }

  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    process.exit(0);
  }
}

testMisPagos();
