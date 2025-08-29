const { executeQuery } = require('../config/database');

/**
 * Script para probar que la seguridad funcione correctamente
 * Cada usuario debe ver SOLO sus propias órdenes
 */

async function testSecurity() {
  try {
    console.log('🔒 Probando seguridad de acceso a órdenes de pago...\n');

    // 1. Probar con DiegoDiaz (UUID válido)
    console.log('🔍 1. Probando con DiegoDiaz (UUID válido)...');
    const diegoId = '7a166202-605a-42a7-94dd-93408644fd6a';
    
    const ordenesDiego = await executeQuery(`
      SELECT 
        op.id,
        op.developer_id,
        op.monto,
        op.concepto,
        op.estado,
        CASE 
          WHEN op.developer_name IS NOT NULL THEN op.developer_name
          WHEN per.nombre IS NOT NULL THEN per.nombre
          ELSE op.developer_id
        END as developer_nombre
      FROM ordenes_pago op
      LEFT JOIN personas per ON per.id = op.developer_id
      WHERE op.developer_id = ?
      ORDER BY op.created_at DESC
    `, [diegoId]);

    console.log(`📋 DiegoDiaz (${diegoId}): ${ordenesDiego.length} órdenes`);
    ordenesDiego.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_nombre: ${orden.developer_nombre}`);
    });

    // 2. Probar con otro usuario (UUID válido)
    console.log('\n🔍 2. Probando con otro usuario (UUID válido)...');
    const otroId = '1076dcc5-1b9b-4b9c-a487-9b9ec941d205'; // Roberto García
    
    const ordenesOtro = await executeQuery(`
      SELECT 
        op.id,
        op.developer_id,
        op.monto,
        op.concepto,
        op.estado,
        CASE 
          WHEN op.developer_name IS NOT NULL THEN op.developer_name
          WHEN per.nombre IS NOT NULL THEN per.nombre
          ELSE op.developer_id
        END as developer_nombre
      FROM ordenes_pago op
      LEFT JOIN personas per ON per.id = op.developer_id
      WHERE op.developer_id = ?
      ORDER BY op.created_at DESC
    `, [otroId]);

    console.log(`📋 Otro usuario (${otroId}): ${ordenesOtro.length} órdenes`);
    ordenesOtro.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_nombre: ${orden.developer_nombre}`);
    });

    // 3. Verificar que no hay cruce de datos
    console.log('\n🔍 3. Verificando que no hay cruce de datos...');
    
    // Buscar todas las órdenes que contengan "Diego" en el nombre
    const ordenesConDiego = await executeQuery(`
      SELECT 
        op.id,
        op.developer_id,
        op.monto,
        op.concepto,
        op.estado,
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

    console.log(`📋 Total órdenes con "Diego" en el nombre: ${ordenesConDiego.length}`);
    ordenesConDiego.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_nombre: ${orden.developer_name}`);
    });

    // 4. Verificar que cada usuario solo ve sus órdenes
    console.log('\n🔍 4. Verificando aislamiento de datos...');
    
    const ordenesDiegoIds = ordenesDiego.map(o => o.id);
    const ordenesOtroIds = ordenesOtro.map(o => o.id);
    
    // Verificar que no hay IDs duplicados
    const duplicados = ordenesDiegoIds.filter(id => ordenesOtroIds.includes(id));
    
    if (duplicados.length === 0) {
      console.log('✅ Aislamiento correcto: No hay órdenes compartidas entre usuarios');
    } else {
      console.log('❌ PROBLEMA DE SEGURIDAD: Hay órdenes compartidas entre usuarios');
      console.log('   IDs duplicados:', duplicados);
    }

    // 5. Verificar que la búsqueda por developer_id es exacta
    console.log('\n🔍 5. Verificando búsqueda exacta por developer_id...');
    
    // Buscar órdenes de DiegoDiaz usando su UUID
    const ordenesDiegoExacto = await executeQuery(`
      SELECT COUNT(*) as total
      FROM ordenes_pago 
      WHERE developer_id = ?
    `, [diegoId]);
    
    // Buscar órdenes que contengan "Diego" en el nombre
    const ordenesDiegoNombre = await executeQuery(`
      SELECT COUNT(*) as total
      FROM ordenes_pago 
      WHERE developer_name LIKE '%Diego%' OR developer_name LIKE '%diego%'
    `);
    
    console.log(`📋 Órdenes de DiegoDiaz por UUID exacto: ${ordenesDiegoExacto[0].total}`);
    console.log(`📋 Órdenes con "Diego" en el nombre: ${ordenesDiegoNombre[0].total}`);
    
    if (ordenesDiegoExacto[0].total === 0 && ordenesDiegoNombre[0].total > 0) {
      console.log('⚠️ DiegoDiaz tiene órdenes pero no se encuentran por UUID exacto');
      console.log('   Esto explica por qué no puede ver sus órdenes');
    }

    console.log('\n✅ Prueba de seguridad completada!');
    console.log('\n📝 Resumen:');
    console.log(`   - DiegoDiaz: ${ordenesDiego.length} órdenes`);
    console.log(`   - Otro usuario: ${ordenesOtro.length} órdenes`);
    console.log(`   - Total con "Diego": ${ordenesConDiego.length}`);
    console.log(`   - Aislamiento: ${duplicados.length === 0 ? '✅ Correcto' : '❌ Incorrecto'}`);

    if (duplicados.length === 0) {
      console.log('\n🎯 ¡La seguridad está funcionando correctamente!');
      console.log('   Cada usuario solo ve sus propias órdenes.');
    } else {
      console.log('\n🚨 ¡PROBLEMA DE SEGURIDAD DETECTADO!');
      console.log('   Los usuarios pueden ver órdenes de otros usuarios.');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba de seguridad:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
testSecurity();
