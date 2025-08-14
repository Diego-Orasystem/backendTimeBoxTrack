const { executeQuery } = require('./config/database');

async function debugFinanzas() {
  try {
    console.log('🔍 DEBUG FINANZAS - Verificando estructura de base de datos...\n');

    // 1. Verificar estructura de ordenes_pago
    console.log('📋 1. ESTRUCTURA DE ordenes_pago:');
    const estructuraOrdenes = await executeQuery('DESCRIBE ordenes_pago');
    console.log(estructuraOrdenes);
    console.log('');

    // 2. Verificar estructura de pagos
    console.log('💰 2. ESTRUCTURA DE pagos:');
    const estructuraPagos = await executeQuery('DESCRIBE pagos');
    console.log(estructuraPagos);
    console.log('');

    // 3. Verificar datos en ordenes_pago
    console.log('📋 3. DATOS EN ordenes_pago:');
    const ordenes = await executeQuery('SELECT * FROM ordenes_pago LIMIT 5');
    console.log('Total de órdenes:', ordenes.length);
    ordenes.forEach((orden, index) => {
      console.log(`Orden ${index + 1}:`, {
        id: orden.id,
        developer_id: orden.developer_id,
        tipo: typeof orden.developer_id,
        monto: orden.monto,
        estado: orden.estado
      });
    });
    console.log('');

    // 4. Verificar datos en pagos
    console.log('💰 4. DATOS EN pagos:');
    const pagos = await executeQuery('SELECT * FROM pagos LIMIT 5');
    console.log('Total de pagos:', pagos.length);
    pagos.forEach((pago, index) => {
      console.log(`Pago ${index + 1}:`, {
        id: pago.id,
        orden_pago_id: pago.orden_pago_id,
        developer_id: pago.developer_id,
        monto: pago.monto,
        metodo: pago.metodo
      });
    });
    console.log('');

    // 5. Verificar relación entre tablas
    console.log('🔗 5. RELACIÓN ENTRE TABLAS:');
    const relacion = await executeQuery(`
      SELECT 
        op.id as orden_id,
        op.developer_id as orden_developer_id,
        p.id as pago_id,
        p.orden_pago_id,
        p.developer_id as pago_developer_id
      FROM ordenes_pago op
      LEFT JOIN pagos p ON op.id = p.orden_pago_id
      LIMIT 5
    `);
    console.log('Relaciones encontradas:', relacion.length);
    relacion.forEach((rel, index) => {
      console.log(`Relación ${index + 1}:`, rel);
    });
    console.log('');

    // 6. Buscar específicamente por Juan Pérez
    console.log('👤 6. BUSCANDO POR JUAN PÉREZ:');
    const juanPerezOrdenes = await executeQuery(`
      SELECT * FROM ordenes_pago 
      WHERE developer_id = 'Juan Pérez' 
      OR developer_id = 'c4ec45fc-1939-43c6-9d4b-2be658567c79'
    `);
    console.log('Órdenes de Juan Pérez:', juanPerezOrdenes.length);
    juanPerezOrdenes.forEach((orden, index) => {
      console.log(`Orden ${index + 1}:`, {
        id: orden.id,
        developer_id: orden.developer_id,
        monto: orden.monto,
        estado: orden.estado
      });
    });

  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    process.exit(0);
  }
}

debugFinanzas();
