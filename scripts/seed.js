const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Datos de ejemplo
const seedData = {
  categories: [
    { id: uuidv4(), nombre: 'Desarrollo Web' },
    { id: uuidv4(), nombre: 'Desarrollo Móvil' },
    { id: uuidv4(), nombre: 'Infraestructura' },
    { id: uuidv4(), nombre: 'Análisis de Datos' }
  ],
  
  types: [
    {
      id: uuidv4(),
      nombre: 'Aplicación Web React',
      definicion: 'Desarrollo de aplicación web usando React.js',
      categoriaId: null, // Se asignará dinámicamente
      entregablesComunes: JSON.stringify(['Código fuente', 'Documentación técnica', 'Manual de usuario']),
      evidenciasCierre: JSON.stringify(['Demo funcional', 'Capturas de pantalla', 'Video de presentación'])
    },
    {
      id: uuidv4(),
      nombre: 'API REST',
      definicion: 'Desarrollo de API REST con Node.js y Express',
      categoriaId: null,
      entregablesComunes: JSON.stringify(['Código fuente', 'Documentación API', 'Tests unitarios']),
      evidenciasCierre: JSON.stringify(['Postman collection', 'Documentación Swagger', 'Tests de integración'])
    },
    {
      id: uuidv4(),
      nombre: 'Aplicación Móvil',
      definicion: 'Desarrollo de aplicación móvil con React Native',
      categoriaId: null,
      entregablesComunes: JSON.stringify(['Código fuente', 'APK/IPA', 'Documentación']),
      evidenciasCierre: JSON.stringify(['Demo en dispositivo', 'Capturas de pantalla', 'Video de funcionalidades'])
    }
  ],
  
  personas: [
    {
      id: uuidv4(),
      nombre: 'Juan Pérez',
      rol: 'Team Leader',
      email: 'juan.perez@empresa.com',
      habilidades: JSON.stringify(['React', 'Node.js', 'TypeScript', 'Git'])
    },
    {
      id: uuidv4(),
      nombre: 'María García',
      rol: 'Business Analyst',
      email: 'maria.garcia@empresa.com',
      habilidades: JSON.stringify(['Análisis de requerimientos', 'UML', 'SQL', 'Excel'])
    },
    {
      id: uuidv4(),
      nombre: 'Carlos López',
      rol: 'Developer',
      email: 'carlos.lopez@empresa.com',
      habilidades: JSON.stringify(['JavaScript', 'React', 'Node.js', 'MongoDB'])
    },
    {
      id: uuidv4(),
      nombre: 'Ana Rodríguez',
      rol: 'Tester',
      email: 'ana.rodriguez@empresa.com',
      habilidades: JSON.stringify(['Testing manual', 'Selenium', 'Jest', 'Postman'])
    },
    {
      id: uuidv4(),
      nombre: 'Luis Martínez',
      rol: 'Developer',
      email: 'luis.martinez@empresa.com',
      habilidades: JSON.stringify(['Java', 'Spring Boot', 'MySQL', 'Docker'])
    }
  ],
  
  projects: [
    {
      id: uuidv4(),
      nombre: 'Sistema de Gestión de Inventarios',
      descripcion: 'Sistema web para gestión de inventarios de la empresa'
    },
    {
      id: uuidv4(),
      nombre: 'Aplicación Móvil de Ventas',
      descripcion: 'Aplicación móvil para el equipo de ventas'
    },
    {
      id: uuidv4(),
      nombre: 'API de Integración',
      descripcion: 'API para integración con sistemas externos'
    }
  ]
};

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando población de base de datos...');

    // Insertar categorías
    console.log('📂 Insertando categorías...');
    for (const category of seedData.categories) {
      await executeQuery(
        'INSERT INTO timebox_categories (id, nombre) VALUES (?, ?)',
        [category.id, category.nombre]
      );
    }

    // Asignar categorías a tipos y insertar tipos
    console.log('🏷️ Insertando tipos de timebox...');
    seedData.types[0].categoriaId = seedData.categories[0].id; // Desarrollo Web
    seedData.types[1].categoriaId = seedData.categories[0].id; // Desarrollo Web
    seedData.types[2].categoriaId = seedData.categories[1].id; // Desarrollo Móvil

    for (const type of seedData.types) {
      await executeQuery(
        'INSERT INTO timebox_types (id, nombre, definicion, categoria_id, entregables_comunes, evidencias_cierre) VALUES (?, ?, ?, ?, ?, ?)',
        [type.id, type.nombre, type.definicion, type.categoriaId, type.entregablesComunes, type.evidenciasCierre]
      );
    }

    // Insertar personas
    console.log('👥 Insertando personas...');
    for (const persona of seedData.personas) {
      await executeQuery(
        'INSERT INTO personas (id, nombre, rol, email, habilidades) VALUES (?, ?, ?, ?, ?)',
        [persona.id, persona.nombre, persona.rol, persona.email, persona.habilidades]
      );
    }

    // Insertar proyectos
    console.log('📁 Insertando proyectos...');
    for (const project of seedData.projects) {
      await executeQuery(
        'INSERT INTO projects (id, nombre, descripcion) VALUES (?, ?, ?)',
        [project.id, project.nombre, project.descripcion]
      );
    }

    // Crear algunos timeboxes de ejemplo
    console.log('⏰ Creando timeboxes de ejemplo...');
    const timebox1 = {
      id: uuidv4(),
      tipoTimeboxId: seedData.types[0].id,
      businessAnalystId: seedData.personas[1].id,
      projectId: seedData.projects[0].id,
      monto: 15000,
      estado: 'En Definicion'
    };

    const timebox2 = {
      id: uuidv4(),
      tipoTimeboxId: seedData.types[1].id,
      businessAnalystId: seedData.personas[1].id,
      projectId: seedData.projects[2].id,
      monto: 8000,
      estado: 'Disponible'
    };

    const timebox3 = {
      id: uuidv4(),
      tipoTimeboxId: seedData.types[2].id,
      businessAnalystId: seedData.personas[1].id,
      projectId: seedData.projects[1].id,
      monto: 25000,
      estado: 'En Ejecucion'
    };

    await executeQuery(
      'INSERT INTO timeboxes (id, tipo_timebox_id, business_analyst_id, project_id, monto, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [timebox1.id, timebox1.tipoTimeboxId, timebox1.businessAnalystId, timebox1.projectId, timebox1.monto, timebox1.estado]
    );

    await executeQuery(
      'INSERT INTO timeboxes (id, tipo_timebox_id, business_analyst_id, project_id, monto, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [timebox2.id, timebox2.tipoTimeboxId, timebox2.businessAnalystId, timebox2.projectId, timebox2.monto, timebox2.estado]
    );

    await executeQuery(
      'INSERT INTO timeboxes (id, tipo_timebox_id, business_analyst_id, project_id, monto, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [timebox3.id, timebox3.tipoTimeboxId, timebox3.businessAnalystId, timebox3.projectId, timebox3.monto, timebox3.estado]
    );

    // Crear fase de planning para el primer timebox
    console.log('📋 Creando fases de ejemplo...');
    const planningId = uuidv4();
    await executeQuery(
      'INSERT INTO planning_phases (id, timebox_id, nombre, codigo, descripcion, fecha_fase, eje, aplicativo, alcance, esfuerzo, fecha_inicio, team_leader_id, completada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        planningId,
        timebox1.id,
        'Planning Sistema Inventarios',
        'PLAN-001',
        'Fase de planificación del sistema de inventarios',
        '2024-01-15',
        'Eje Tecnológico',
        'Sistema Web',
        'Alcance Completo',
        'Esfuerzo Alto',
        '2024-01-20',
        seedData.personas[0].id,
        false
      ]
    );

    // Agregar skills al planning
    const skills = [
      { tipo: 'Frontend', nombre: 'React.js' },
      { tipo: 'Backend', nombre: 'Node.js' },
      { tipo: 'Base de Datos', nombre: 'MariaDB' }
    ];

    for (const skill of skills) {
      await executeQuery(
        'INSERT INTO planning_skills (id, planning_id, tipo, nombre) VALUES (?, ?, ?, ?)',
        [uuidv4(), planningId, skill.tipo, skill.nombre]
      );
    }

    // Crear algunos adjuntos de ejemplo
    console.log('📎 Creando adjuntos de ejemplo...');
    const adjunto1 = {
      id: uuidv4(),
      tipo: 'Documento',
      nombre: 'Especificaciones técnicas.pdf',
      url: '/uploads/especificaciones.pdf',
      file_size: 1024000,
      mime_type: 'application/pdf'
    };

    const adjunto2 = {
      id: uuidv4(),
      tipo: 'Imagen',
      nombre: 'Mockup principal.png',
      url: '/uploads/mockup.png',
      file_size: 512000,
      mime_type: 'image/png'
    };

    await executeQuery(
      'INSERT INTO adjuntos (id, tipo, nombre, url, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
      [adjunto1.id, adjunto1.tipo, adjunto1.nombre, adjunto1.url, adjunto1.file_size, adjunto1.mime_type]
    );

    await executeQuery(
      'INSERT INTO adjuntos (id, tipo, nombre, url, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
      [adjunto2.id, adjunto2.tipo, adjunto2.nombre, adjunto2.url, adjunto2.file_size, adjunto2.mime_type]
    );

    // Relacionar adjuntos con planning
    await executeQuery(
      'INSERT INTO planning_adjuntos (planning_id, adjunto_id) VALUES (?, ?)',
      [planningId, adjunto1.id]
    );

    await executeQuery(
      'INSERT INTO planning_adjuntos (planning_id, adjunto_id) VALUES (?, ?)',
      [planningId, adjunto2.id]
    );

    // Crear checklist de ejemplo
    console.log('✅ Creando checklist de ejemplo...');
    const checklistItems = [
      'Revisar requerimientos del cliente',
      'Definir arquitectura del sistema',
      'Establecer cronograma de desarrollo',
      'Asignar recursos del equipo'
    ];

    for (const item of checklistItems) {
      const checklistId = uuidv4();
      await executeQuery(
        'INSERT INTO checklists (id, label, checked) VALUES (?, ?, ?)',
        [checklistId, item, false]
      );

      await executeQuery(
        'INSERT INTO planning_checklists (planning_id, checklist_id) VALUES (?, ?)',
        [planningId, checklistId]
      );
    }

    // Crear contenido de proyectos de ejemplo
    console.log('📁 Creando contenido de proyectos de ejemplo...');
    
    // Contenido para el primer proyecto (Sistema de Gestión de Inventarios)
    const carpeta1 = uuidv4();
    const carpeta2 = uuidv4();
    const documento1 = uuidv4();
    const documento2 = uuidv4();
    
    // Carpeta raíz del proyecto 1
    await executeQuery(
      'INSERT INTO project_content (id, project_id, nombre, tipo, descripcion, parent_id, adjunto_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [carpeta1, seedData.projects[0].id, 'Documentación Técnica', 'Carpeta', 'Documentación técnica del sistema de inventarios', null, null]
    );
    
    // Subcarpeta dentro de la carpeta raíz
    await executeQuery(
      'INSERT INTO project_content (id, project_id, nombre, tipo, descripcion, parent_id, adjunto_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [carpeta2, seedData.projects[0].id, 'Especificaciones', 'Carpeta', 'Especificaciones detalladas del sistema', carpeta1, null]
    );
    
    // Documento dentro de la subcarpeta
    await executeQuery(
      'INSERT INTO project_content (id, project_id, nombre, tipo, descripcion, parent_id, adjunto_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [documento1, seedData.projects[0].id, 'Requerimientos Funcionales', 'Documento', 'Documento de requerimientos funcionales', carpeta2, adjunto1.id]
    );
    
    // Documento raíz del proyecto 1
    await executeQuery(
      'INSERT INTO project_content (id, project_id, nombre, tipo, descripcion, parent_id, adjunto_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [documento2, seedData.projects[0].id, 'Manual de Usuario', 'Documento', 'Manual de usuario del sistema', null, adjunto2.id]
    );

    console.log('✅ Base de datos poblada exitosamente!');
    console.log('\n📊 Resumen de datos insertados:');
    console.log(`   - ${seedData.categories.length} categorías`);
    console.log(`   - ${seedData.types.length} tipos de timebox`);
    console.log(`   - ${seedData.personas.length} personas`);
    console.log(`   - ${seedData.projects.length} proyectos`);
    console.log(`   - 3 timeboxes de ejemplo`);
    console.log(`   - 1 fase de planning con skills y adjuntos`);
    console.log(`   - 2 adjuntos de ejemplo`);
    console.log(`   - 4 items de checklist`);
    console.log(`   - 2 carpetas de ejemplo`);
    console.log(`   - 2 documentos de ejemplo`);

  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Proceso completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase, seedData }; 