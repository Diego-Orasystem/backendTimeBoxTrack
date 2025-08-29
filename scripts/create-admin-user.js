const { executeQuery } = require('../config/database');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  try {
    console.log('🔧 Creando usuario admin...');
    
    // Verificar si ya existe el usuario admin
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );
    
    if (existingUser.length > 0) {
      console.log('✅ Usuario admin ya existe');
      return;
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Crear usuario admin
    const result = await executeQuery(`
      INSERT INTO users (
        id, username, email, password_hash, first_name, last_name, 
        is_active, is_verified, created_at, updated_at
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, 1, 1, NOW(), NOW()
      )
    `, [
      'admin',
      'admin@timebox.com',
      hashedPassword,
      'Administrador',
      'Sistema'
    ]);
    
    console.log('✅ Usuario admin creado exitosamente');
    console.log('📋 Credenciales:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
    console.log('   Email: admin@timebox.com');
    
  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminUser().then(() => {
    console.log('🏁 Script completado');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { createAdminUser };
