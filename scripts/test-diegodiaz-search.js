const { executeQuery } = require('../config/database');

/**
 * Script para probar la búsqueda de órdenes de DiegoDiaz
 * Esto nos ayudará a verificar que la consulta SQL funcione correctamente
 */

async function testDiegoDiazSearch() {
  try {
    console.log('🧪 Probando búsqueda de órdenes de DiegoDiaz...\n');

    const userId = '7a166202-605a-42a7-94dd-93408644fd6a'; // ID de DiegoDiaz en users

    console.log('🔍 userId a buscar:', userId);

    // 1. Búsqueda original (solo por developer_id)
    console.log('🔍 1. Búsqueda original (solo por developer_id)...');
    const search1 = await executeQuery(`
      SELECT id, developer_id, developer_name, monto, concepto, created_at
      FROM ordenes_pago 
      WHERE developer_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    console.log(`📋 Resultados búsqueda 1: ${search1.length} órdenes`);
    search1.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_name: ${orden.developer_name}`);
    });

    // 2. Búsqueda mejorada (por developer_id, developer_name, o nombre parcial)
    console.log('\n🔍 2. Búsqueda mejorada (por developer_id, developer_name, o nombre parcial)...');
    const search2 = await executeQuery(`
      SELECT id, developer_id, developer_name, monto, concepto, created_at
      FROM ordenes_pago 
      WHERE developer_id = ? 
         OR developer_name LIKE ? 
         OR developer_name LIKE ?
      ORDER BY created_at DESC
    `, [userId, `%${userId}%`, `%Diego%`]);

    console.log(`📋 Resultados búsqueda 2: ${search2.length} órdenes`);
    search2.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_name: ${orden.developer_name}`);
    });

    // 3. Búsqueda por nombre específico
    console.log('\n🔍 3. Búsqueda por nombre específico "Diego Diaz"...');
    const search3 = await executeQuery(`
      SELECT id, developer_id, developer_name, monto, concepto, created_at
      FROM ordenes_pago 
      WHERE developer_name LIKE '%Diego%' OR developer_name LIKE '%diego%'
      ORDER BY created_at DESC
    `);

    console.log(`📋 Resultados búsqueda 3: ${search3.length} órdenes`);
    search3.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_name: ${orden.developer_name}`);
    });

    // 4. Verificar todas las órdenes para entender el patrón
    console.log('\n🔍 4. Todas las órdenes (últimas 10)...');
    const allOrdenes = await executeQuery(`
      SELECT id, developer_id, developer_name, monto, concepto, created_at
      FROM ordenes_pago 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`📋 Total de órdenes revisadas: ${allOrdenes.length}`);
    allOrdenes.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_name: ${orden.developer_name}`);
    });

    console.log('\n✅ Prueba completada!');
    console.log('\n📝 Resumen:');
    console.log(`   - Búsqueda 1 (solo developer_id): ${search1.length} órdenes`);
    console.log(`   - Búsqueda 2 (mejorada): ${search2.length} órdenes`);
    console.log(`   - Búsqueda 3 (por nombre): ${search3.length} órdenes`);
    console.log(`   - Total revisado: ${allOrdenes.length} órdenes`);

    if (search2.length > 0) {
      console.log('\n🎯 ¡La búsqueda mejorada funciona!');
      console.log('   DiegoDiaz tiene órdenes de pago que se pueden encontrar por nombre.');
    } else {
      console.log('\n❌ La búsqueda mejorada no encontró órdenes.');
      console.log('   Necesitamos investigar más el patrón de datos.');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
testDiegoDiazSearch();
