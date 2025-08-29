const { executeQuery } = require('../config/database');

async function updateRoleLevels() {
  try {
    console.log('🔄 Iniciando actualización de niveles de roles...');
    
    // Actualizar niveles de roles para que coincidan con el frontend
    const updates = [
      { id: 'role-001', level: 'PLATFORM', name: 'Platform Administrator' },
      { id: 'role-002', level: 'PLATFORM', name: 'Business Sponsor' },
      { id: 'role-003', level: 'PROJECT', name: 'Project Manager' },
      { id: 'role-004', level: 'TEAM', name: 'Team Leader' },
      { id: 'role-005', level: 'SUPPORT', name: 'Finance Approver' },
      { id: 'role-006', level: 'SUPPORT', name: 'Treasurer' },
      { id: 'role-007', level: 'PLATFORM', name: 'Business Analyst' },
      { id: 'role-008', level: 'TEAM', name: 'Solution Developer' },
      { id: 'role-009', level: 'TEAM', name: 'Solution Tester' },
      { id: 'role-010', level: 'TEAM', name: 'Deployment Team' },
      { id: 'role-011', level: 'SUPPORT', name: 'Project Support' },
      { id: 'role-012', level: 'PLATFORM', name: 'Business Change Team' },
      { id: 'role-013', level: 'PROJECT', name: 'Business Change Manager' },
      { id: 'role-014', level: 'SUPPORT', name: 'Project Assurance' },
      { id: 'role-015', level: 'SUPPORT', name: 'Project Office' },
      { id: 'role-016', level: 'SUPPORT', name: 'Stakeholder' }
    ];

    for (const role of updates) {
      console.log(`🔄 Actualizando ${role.name} (${role.id}) a nivel ${role.level}...`);
      
      await executeQuery(
        'UPDATE roles SET level = ? WHERE id = ?',
        [role.level, role.id]
      );
      
      console.log(`✅ ${role.name} actualizado correctamente`);
    }

    // Verificar la actualización
    console.log('\n📊 Verificando roles actualizados...');
    const roles = await executeQuery('SELECT id, name, level FROM roles ORDER BY id');
    
    console.log('\n🎭 Roles en la base de datos:');
    roles.forEach(role => {
      console.log(`  ${role.id}: ${role.name} (${role.level})`);
    });

    console.log('\n✅ Actualización de niveles de roles completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error actualizando niveles de roles:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateRoleLevels()
    .then(() => {
      console.log('🎉 Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { updateRoleLevels };
