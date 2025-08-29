const { executeQuery } = require('../config/database');

async function checkRoles() {
  try {
    console.log('🔍 Verificando roles existentes...');
    
    // Verificar tabla de roles
    const roles = await executeQuery('SELECT * FROM roles');
    console.log('📋 Roles encontrados:', roles.length);
    roles.forEach(role => {
      console.log(`   - ID: ${role.id}, Nombre: ${role.name}, Nivel: ${role.level || 'N/A'}`);
    });
    
    // Verificar tabla de usuarios
    const users = await executeQuery('SELECT * FROM users');
    console.log('\n👥 Usuarios encontrados:', users.length);
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });
    
    // Verificar tabla de user_roles
    const userRoles = await executeQuery('SELECT * FROM user_roles');
    console.log('\n🔗 Asignaciones de roles:', userRoles.length);
    userRoles.forEach(ur => {
      console.log(`   - Usuario: ${ur.user_id}, Rol: ${ur.role_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error al verificar roles:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkRoles().then(() => {
    console.log('\n🏁 Script completado');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { checkRoles };
