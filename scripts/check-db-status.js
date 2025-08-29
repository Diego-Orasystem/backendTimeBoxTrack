const db = require('../config/database');

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n');

    // Verificar roles
    console.log('1️⃣ Verificando tabla roles...');
    try {
      const roles = await db.executeQuery('SELECT COUNT(*) as total FROM roles WHERE is_active = TRUE');
      console.log(`✅ Roles activos: ${roles[0].total}`);
      
      if (roles[0].total > 0) {
        const roleList = await db.executeQuery('SELECT id, name FROM roles WHERE is_active = TRUE LIMIT 5');
        console.log('📋 Primeros roles:');
        roleList.forEach(role => console.log(`   - ${role.id}: ${role.name}`));
      }
    } catch (error) {
      console.log('❌ Error en tabla roles:', error.message);
    }

    // Verificar role_sueldos
    console.log('\n2️⃣ Verificando tabla role_sueldos...');
    try {
      const sueldos = await db.executeQuery('SELECT COUNT(*) as total FROM role_sueldos WHERE is_active = TRUE');
      console.log(`✅ Sueldos activos: ${sueldos[0].total}`);
      
      if (sueldos[0].total > 0) {
        const sueldoList = await db.executeQuery('SELECT role_id, sueldo_base_semanal FROM role_sueldos WHERE is_active = TRUE LIMIT 5');
        console.log('💰 Primeros sueldos:');
        sueldoList.forEach(sueldo => console.log(`   - ${sueldo.role_id}: $${sueldo.sueldo_base_semanal}`));
      }
    } catch (error) {
      console.log('❌ Error en tabla role_sueldos:', error.message);
    }

    // Verificar estructura de tablas
    console.log('\n3️⃣ Verificando estructura de tablas...');
    try {
      const tableInfo = await db.executeQuery("SHOW TABLES LIKE 'roles'");
      console.log(`✅ Tabla roles: ${tableInfo.length > 0 ? 'Existe' : 'No existe'}`);
      
      const sueldoTableInfo = await db.executeQuery("SHOW TABLES LIKE 'role_sueldos'");
      console.log(`✅ Tabla role_sueldos: ${sueldoTableInfo.length > 0 ? 'Existe' : 'No existe'}`);
    } catch (error) {
      console.log('❌ Error verificando estructura:', error.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseStatus();
