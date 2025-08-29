const db = require('../config/database');

async function setupRolesSueldos() {
  try {
    console.log('🎯 Configurando tabla de sueldos de roles...\n');

    // 1. Crear tabla role_sueldos
    console.log('1️⃣ Creando tabla role_sueldos...');
    await db.executeQuery(`
      CREATE TABLE IF NOT EXISTS role_sueldos (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        role_id VARCHAR(36) NOT NULL,
        sueldo_base_semanal DECIMAL(10,2) DEFAULT 0.00,
        moneda VARCHAR(10) DEFAULT 'USD',
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla role_sueldos creada exitosamente');

    // 2. Insertar roles básicos si no existen
    console.log('\n2️⃣ Verificando roles básicos...');
    const rolesToInsert = [
      ['role-001', 'Platform Administrator', 'Administrador de la plataforma con acceso completo', 'admin'],
      ['role-002', 'Business Sponsor', 'Patrocinador del negocio con acceso a proyectos y finanzas', 'sponsor'],
      ['role-003', 'Project Manager', 'Gerente de proyecto con acceso a gestión de proyectos', 'manager'],
      ['role-004', 'Team Leader', 'Líder de equipo con acceso a gestión de equipo', 'leader'],
      ['role-005', 'Finance Approver', 'Aprobador financiero con acceso a finanzas', 'finance'],
      ['role-006', 'Treasurer', 'Tesorero con acceso a ejecución de pagos', 'finance'],
      ['role-007', 'Business Analyst', 'Analista de negocio con acceso a análisis', 'analyst'],
      ['role-008', 'Solution Developer', 'Desarrollador de soluciones', 'developer'],
      ['role-009', 'Solution Tester', 'Probador de soluciones', 'tester'],
      ['role-010', 'Deployment Team', 'Equipo de despliegue', 'deployment'],
      ['role-011', 'Project Support', 'Soporte del proyecto', 'support'],
      ['role-012', 'Business Change Team', 'Equipo de cambio de negocio', 'change'],
      ['role-013', 'Business Change Manager', 'Gerente de cambio de negocio', 'manager'],
      ['role-014', 'Project Assurance', 'Aseguramiento del proyecto', 'assurance'],
      ['role-015', 'Project Office', 'Oficina del proyecto', 'office'],
      ['role-016', 'Stakeholder', 'Interesado del proyecto', 'stakeholder']
    ];

    for (const [id, name, description, level] of rolesToInsert) {
      try {
        await db.executeQuery(
          'INSERT IGNORE INTO roles (id, name, description, level, is_active) VALUES (?, ?, ?, ?, TRUE)',
          [id, name, description, level]
        );
      } catch (error) {
        console.log(`⚠️  Rol ${name} ya existe o error:`, error.message);
      }
    }
    console.log('✅ Roles básicos verificados');

    // 3. Insertar sueldos base iniciales
    console.log('\n3️⃣ Configurando sueldos base iniciales...');
         const sueldosToInsert = [
       ['role-001', 0.00, 'USD'],
       ['role-002', 0.00, 'USD'],
       ['role-003', 1200.00, 'USD'],
       ['role-004', 1000.00, 'USD'],
       ['role-005', 1100.00, 'USD'],
       ['role-006', 1000.00, 'USD'],
       ['role-007', 900.00, 'USD'],
       ['role-008', 800.00, 'USD'],
       ['role-009', 700.00, 'USD'],
       ['role-010', 750.00, 'USD'],
       ['role-011', 600.00, 'USD'],
       ['role-012', 650.00, 'USD'],
       ['role-013', 1100.00, 'USD'],
       ['role-014', 950.00, 'USD'],
       ['role-015', 700.00, 'USD'],
       ['role-016', 0.00, 'USD']
     ];

         for (const [roleId, sueldo, moneda] of sueldosToInsert) {
       try {
         // Verificar si ya existe un sueldo activo para este rol
         const existingSueldos = await db.executeQuery(
           'SELECT id FROM role_sueldos WHERE role_id = ? AND is_active = TRUE',
           [roleId]
         );

         if (existingSueldos.length === 0) {
           // Insertar nuevo sueldo
           await db.executeQuery(
             'INSERT INTO role_sueldos (id, role_id, sueldo_base_semanal, moneda, fecha_inicio) VALUES (UUID(), ?, ?, ?, CURDATE())',
             [roleId, sueldo, moneda]
           );
           console.log(`✅ Sueldo configurado para ${roleId}: ${moneda} ${sueldo}`);
         } else {
           console.log(`ℹ️  Sueldo ya existe para ${roleId}`);
         }
       } catch (error) {
         console.log(`⚠️  Error configurando sueldo para ${roleId}:`, error.message);
       }
     }

    console.log('\n🎉 ¡Configuración de roles y sueldos completada exitosamente!');
    console.log('\n📊 Para verificar, puedes consultar:');
    console.log('   - SELECT * FROM roles WHERE is_active = TRUE;');
    console.log('   - SELECT * FROM role_sueldos WHERE is_active = TRUE;');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la configuración
setupRolesSueldos();
