const mariadb = require('mariadb');
require('dotenv').config();

async function addMissingTeamRoles() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mariadb.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'timebox_track'
    });

    console.log('🔌 Conectado a la base de datos');

    // Roles de TEAM que faltan
    const missingRoles = [
      {
        id: 'role-018',
        name: 'Business Ambassador',
        level: 'TEAM',
        description: 'Embajador de negocio que representa los intereses del negocio en el equipo técnico'
      },
      {
        id: 'role-019',
        name: 'Business Advisor',
        level: 'TEAM',
        description: 'Asesor de negocio que proporciona orientación estratégica al equipo'
      },
      {
        id: 'role-020',
        name: 'Technical Advisor',
        level: 'TEAM',
        description: 'Asesor técnico que proporciona orientación técnica al equipo'
      }
    ];

    console.log('📝 Agregando roles de TEAM faltantes...');

    // Insertar cada rol
    for (const role of missingRoles) {
      const result = await connection.query(
        'INSERT INTO roles (id, name, level, description, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [role.id, role.name, role.level, role.description]
      );
      
      console.log(`✅ Rol "${role.name}" agregado con ID: ${role.id}`);
    }

    // Verificar que se insertaron correctamente
    console.log('\n🔍 Verificando roles de TEAM en la base de datos...');
    
    const teamRoles = await connection.query(
      'SELECT id, name, level, description FROM roles WHERE level = ? ORDER BY name',
      ['TEAM']
    );

    console.log('\n📊 Roles de TEAM disponibles:');
    teamRoles.forEach(role => {
      console.log(`  - ${role.name} (${role.id}) - ${role.description}`);
    });

    // Mostrar estadísticas
    const stats = await connection.query(`
      SELECT 
        r.level,
        COUNT(*) as total_roles,
        COUNT(ur.user_id) as roles_asignados
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.level
      ORDER BY r.level
    `);

    console.log('\n📈 Estadísticas por nivel:');
    stats.forEach(stat => {
      console.log(`  - ${stat.level}: ${stat.total_roles} roles, ${stat.roles_asignados} asignados`);
    });

    console.log('\n🎉 Script completado exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('💡 Algunos roles ya existen en la base de datos');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
addMissingTeamRoles();
