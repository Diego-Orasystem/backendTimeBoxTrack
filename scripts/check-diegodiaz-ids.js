const { executeQuery } = require('../config/database');

/**
 * Script para verificar los IDs de DiegoDiaz en diferentes tablas
 * Esto nos ayudará a entender por qué no se encuentran las órdenes de pago
 */

async function checkDiegoDiazIds() {
  try {
    console.log('🔍 Verificando IDs de DiegoDiaz en diferentes tablas...\n');

    // 1. Verificar en la tabla users
    console.log('🔍 1. Verificando en tabla users...');
    const users = await executeQuery(`
      SELECT id, username, email, is_active, created_at
      FROM users 
      WHERE username = 'DiegoDiaz' OR email LIKE '%diego%'
    `);

    if (users.length > 0) {
      console.log('📋 Usuarios encontrados en tabla users:');
      users.forEach(user => {
        console.log(`   - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Activo: ${user.is_active}`);
      });
    } else {
      console.log('❌ No se encontraron usuarios con username DiegoDiaz');
    }

    // 2. Verificar en la tabla personas
    console.log('\n🔍 2. Verificando en tabla personas...');
    const personas = await executeQuery(`
      SELECT id, nombre, email, rol, created_at
      FROM personas 
      WHERE nombre LIKE '%Diego%' OR email LIKE '%diego%'
    `);

    if (personas.length > 0) {
      console.log('📋 Personas encontradas en tabla personas:');
      personas.forEach(persona => {
        console.log(`   - ID: ${persona.id}, Nombre: ${persona.nombre}, Email: ${persona.email}, Rol: ${persona.rol}`);
      });
    } else {
      console.log('❌ No se encontraron personas con nombre Diego');
    }

    // 3. Verificar en la tabla ordenes_pago
    console.log('\n🔍 3. Verificando en tabla ordenes_pago...');
    const ordenes = await executeQuery(`
      SELECT id, developer_id, developer_name, monto, concepto, created_at
      FROM ordenes_pago 
      WHERE developer_id IN (
        SELECT id FROM users WHERE username = 'DiegoDiaz'
        UNION
        SELECT id FROM personas WHERE nombre LIKE '%Diego%'
      )
      OR developer_name LIKE '%Diego%'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (ordenes.length > 0) {
      console.log('📋 Órdenes de pago encontradas:');
      ordenes.forEach(orden => {
        console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_name: ${orden.developer_name}, monto: ${orden.monto}`);
      });
    } else {
      console.log('❌ No se encontraron órdenes de pago para DiegoDiaz');
    }

    // 4. Verificar todas las órdenes recientes para entender el patrón
    console.log('\n🔍 4. Verificando órdenes recientes...');
    const ordenesRecientes = await executeQuery(`
      SELECT id, developer_id, developer_name, monto, concepto, created_at
      FROM ordenes_pago 
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('📋 Últimas 5 órdenes de pago:');
    ordenesRecientes.forEach(orden => {
      console.log(`   - ID: ${orden.id}, developer_id: ${orden.developer_id}, developer_name: ${orden.developer_name}, monto: ${orden.monto}`);
    });

    // 5. Verificar si hay inconsistencias en developer_id
    console.log('\n🔍 5. Verificando inconsistencias en developer_id...');
    const inconsistencias = await executeQuery(`
      SELECT DISTINCT developer_id, COUNT(*) as total
      FROM ordenes_pago 
      GROUP BY developer_id
      HAVING COUNT(*) > 1
      ORDER BY total DESC
      LIMIT 10
    `);

    if (inconsistencias.length > 0) {
      console.log('📋 Developer IDs con múltiples órdenes:');
      inconsistencias.forEach(item => {
        console.log(`   - developer_id: ${item.developer_id}, total órdenes: ${item.total}`);
      });
    } else {
      console.log('✅ No se encontraron inconsistencias en developer_id');
    }

    console.log('\n✅ Verificación completada!');
    console.log('\n📝 Resumen:');
    console.log(`   - Usuarios encontrados: ${users.length}`);
    console.log(`   - Personas encontradas: ${personas.length}`);
    console.log(`   - Órdenes para DiegoDiaz: ${ordenes.length}`);
    console.log(`   - Órdenes recientes revisadas: ${ordenesRecientes.length}`);

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
checkDiegoDiazIds();
