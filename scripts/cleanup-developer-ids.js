const { executeQuery } = require('../config/database');

/**
 * Script para limpiar y corregir developer_id inconsistentes en la base de datos
 * 
 * Este script identifica y corrige los registros que tienen developer_id que no son UUIDs válidos
 * o que no están en la tabla personas.
 */

async function cleanupDeveloperIds() {
  try {
    console.log('🧹 Iniciando limpieza de developer_id inconsistentes...\n');

    // 1. Identificar registros con developer_id que no son UUIDs válidos
    console.log('🔍 1. Identificando registros con developer_id inválidos...');
    const invalidDeveloperIds = await executeQuery(`
      SELECT 
        id,
        developer_id,
        created_at,
        concepto
      FROM ordenes_pago 
      WHERE developer_id NOT REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      ORDER BY created_at DESC
    `);

    console.log(`📋 Encontrados ${invalidDeveloperIds.length} registros con developer_id inválidos:`);
    invalidDeveloperIds.forEach(record => {
      console.log(`   - ID: ${record.id}, developer_id: "${record.developer_id}", fecha: ${record.created_at}`);
    });

    if (invalidDeveloperIds.length === 0) {
      console.log('✅ No se encontraron developer_id inválidos. La base de datos está limpia.');
      return;
    }

    // 2. Identificar registros con developer_id que no están en la tabla personas
    console.log('\n🔍 2. Identificando registros con developer_id que no están en personas...');
    const missingPersonas = await executeQuery(`
      SELECT 
        op.id,
        op.developer_id,
        op.created_at,
        op.concepto
      FROM ordenes_pago op
      LEFT JOIN personas per ON per.id = op.developer_id
      WHERE per.id IS NULL
      ORDER BY op.created_at DESC
    `);

    console.log(`📋 Encontrados ${missingPersonas.length} registros sin persona correspondiente:`);
    missingPersonas.forEach(record => {
      console.log(`   - ID: ${record.id}, developer_id: "${record.developer_id}", fecha: ${record.created_at}`);
    });

    // 3. Crear registros en la tabla personas para los developer_id faltantes
    console.log('\n🔧 3. Creando registros en personas para developer_id faltantes...');
    
    for (const record of missingPersonas) {
      const developerId = record.developer_id;
      
      // Verificar si ya existe en personas
      const existingPerson = await executeQuery('SELECT id FROM personas WHERE id = ?', [developerId]);
      
      if (existingPerson.length === 0) {
        // Crear un registro en personas
        const personaId = developerId;
        const nombre = developerId; // Usar el developer_id como nombre temporal
        const rol = 'Developer'; // Rol por defecto
        const email = `${developerId}@temp.com`; // Email temporal
        
        try {
          await executeQuery(`
            INSERT INTO personas (id, nombre, rol, email, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
          `, [personaId, nombre, rol, email]);
          
          console.log(`   ✅ Creada persona: ${nombre} (${personaId})`);
        } catch (error) {
          console.log(`   ❌ Error creando persona ${nombre}:`, error.message);
        }
      }
    }

    // 4. Verificar el estado final
    console.log('\n🔍 4. Verificando estado final...');
    const finalCheck = await executeQuery(`
      SELECT 
        op.id,
        op.developer_id,
        CASE 
          WHEN per.nombre IS NOT NULL THEN per.nombre
          WHEN op.developer_id REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN op.developer_id
          ELSE op.developer_id
        END as developer_nombre
      FROM ordenes_pago op
      LEFT JOIN personas per ON per.id = op.developer_id
      ORDER BY op.created_at DESC
      LIMIT 10
    `);

    console.log('\n📋 Estado final (primeras 10 órdenes):');
    finalCheck.forEach(record => {
      console.log(`   - ID: ${record.id}, developer_id: "${record.developer_id}", nombre: "${record.developer_nombre}"`);
    });

    console.log('\n✅ Limpieza completada exitosamente!');
    console.log('\n📝 Resumen de acciones:');
    console.log(`   - Registros con developer_id inválidos: ${invalidDeveloperIds.length}`);
    console.log(`   - Registros sin persona correspondiente: ${missingPersonas.length}`);
    console.log(`   - Personas creadas: ${missingPersonas.length}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
cleanupDeveloperIds();
