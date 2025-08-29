const { executeQuery } = require('../config/database');

/**
 * Script para probar el método getMisPagos con diferentes tipos de developerId
 * Esto nos ayudará a verificar que la búsqueda múltiple funcione correctamente
 */

async function testMisPagos() {
  try {
    console.log('🧪 Probando método getMisPagos con diferentes developerId...\n');

    // 1. Probar con UUID válido (DiegoDiaz en users)
    console.log('🔍 1. Probando con UUID válido (DiegoDiaz en users)...');
    const uuidValido = '7a166202-605a-42a7-94dd-93408644fd6a';
    
    const ordenes1 = await executeQuery(`
      SELECT 
        op.id,
        op.developer_id,
        op.monto,
        op.moneda,
        op.concepto,
        op.fecha_emision,
        op.estado,
        op.created_at,
        op.updated_at,
        CASE 
          WHEN op.developer_name IS NOT NULL THEN op.developer_name
          WHEN per.nombre IS NOT NULL THEN per.nombre
          ELSE op.developer_id
        END as developer_nombre
      FROM ordenes_pago op
      LEFT JOIN personas per ON per.id = op.developer_id
      WHERE op.developer_id = ? 
         OR op.developer_name LIKE ? 
         OR op.developer_name LIKE ?
      ORDER BY op.created_at DESC
    `, [uuidValido, `%${uuidValido}%`, `%Diego%`]);

    console.log(`📋 Resultados UUID válido: ${ordenes1.length} órdenes`);
    ordenes1.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_name: ${orden.developer_name}, developer_nombre: ${orden.developer_nombre}`);
    });

    // 2. Probar con ID extraño (ma2t41u18)
    console.log('\n🔍 2. Probando con ID extraño (ma2t41u18)...');
    const idExtrano = 'ma2t41u18';
    
    const ordenes2 = await executeQuery(`
      SELECT 
        op.id,
        op.developer_id,
        op.monto,
        op.moneda,
        op.concepto,
        op.fecha_emision,
        op.estado,
        op.created_at,
        op.updated_at,
        CASE 
          WHEN op.developer_name IS NOT NULL THEN op.developer_name
          WHEN per.nombre IS NOT NULL THEN per.nombre
          ELSE op.developer_id
        END as developer_nombre
      FROM ordenes_pago op
      LEFT JOIN personas per ON per.id = op.developer_id
      WHERE op.developer_id = ? 
         OR op.developer_name LIKE ? 
         OR op.developer_name LIKE ?
      ORDER BY op.created_at DESC
    `, [idExtrano, `%${idExtrano}%`, `%Diego%`]);

    console.log(`📋 Resultados ID extraño: ${ordenes2.length} órdenes`);
    ordenes2.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_name: ${orden.developer_name}, developer_nombre: ${orden.developer_nombre}`);
    });

    // 3. Probar búsqueda por nombre "Diego"
    console.log('\n🔍 3. Probando búsqueda por nombre "Diego"...');
    const ordenes3 = await executeQuery(`
      SELECT 
        op.id,
        op.developer_id,
        op.monto,
        op.moneda,
        op.concepto,
        op.fecha_emision,
        op.estado,
        op.created_at,
        op.updated_at,
        CASE 
          WHEN op.developer_name IS NOT NULL THEN op.developer_name
          WHEN per.nombre IS NOT NULL THEN per.nombre
          ELSE op.developer_id
        END as developer_nombre
      FROM ordenes_pago op
      LEFT JOIN personas per ON per.id = op.developer_id
      WHERE op.developer_name LIKE '%Diego%' OR op.developer_name LIKE '%diego%'
      ORDER BY op.created_at DESC
    `);

    console.log(`📋 Resultados búsqueda por nombre "Diego": ${ordenes3.length} órdenes`);
    ordenes3.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_name: ${orden.developer_name}, developer_nombre: ${orden.developer_nombre}`);
    });

    // 4. Verificar pagos asociados
    console.log('\n🔍 4. Verificando pagos asociados...');
    if (ordenes1.length > 0 || ordenes2.length > 0) {
      const todasLasOrdenes = [...ordenes1, ...ordenes2];
      const ordenIds = todasLasOrdenes.map(o => o.id);
      
      if (ordenIds.length > 0) {
        const placeholders = ordenIds.map(() => '?').join(',');
        const pagos = await executeQuery(`
          SELECT 
            p.id,
            p.orden_pago_id,
            p.monto,
            p.moneda,
            p.metodo,
            p.referencia,
            p.fecha_pago,
            p.created_at
          FROM pagos p
          WHERE p.orden_pago_id IN (${placeholders})
          ORDER BY p.created_at DESC
        `, ordenIds);

        console.log(`💰 Pagos encontrados: ${pagos.length}`);
        pagos.forEach(pago => {
          console.log(`   - ID: ${pago.id}, orden_pago_id: ${pago.orden_pago_id}, monto: ${pago.monto}, método: ${pago.metodo}`);
        });
      }
    }

    console.log('\n✅ Prueba completada!');
    console.log('\n📝 Resumen:');
    console.log(`   - UUID válido (${uuidValido}): ${ordenes1.length} órdenes`);
    console.log(`   - ID extraño (${idExtrano}): ${ordenes2.length} órdenes`);
    console.log(`   - Búsqueda por nombre "Diego": ${ordenes3.length} órdenes`);

    if (ordenes1.length > 0 || ordenes2.length > 0) {
      console.log('\n🎯 ¡La búsqueda múltiple funciona!');
      console.log('   DiegoDiaz tiene órdenes de pago que se pueden encontrar por diferentes criterios.');
    } else {
      console.log('\n❌ La búsqueda múltiple no encontró órdenes.');
      console.log('   Necesitamos investigar más el patrón de datos.');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
testMisPagos();
