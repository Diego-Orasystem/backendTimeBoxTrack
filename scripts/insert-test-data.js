require('dotenv').config();
const { executeQuery, executeTransaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Datos de prueba para personas
const personasPrueba = [
  {
    id: uuidv4(),
    nombre: 'Carlos Rodriguez',
    rol: 'Team Leader',
    email: 'carlos.rodriguez@empresa.com',
    habilidades: ['Liderazgo', 'Gestión de equipos', 'Scrum Master', 'Comunicación']
  },
  {
    id: uuidv4(),
    nombre: 'María González',
    rol: 'Business Analyst',
    email: 'maria.gonzalez@empresa.com',
    habilidades: ['Análisis de requisitos', 'Documentación', 'UML', 'Casos de uso']
  },
  {
    id: uuidv4(),
    nombre: 'Juan Pérez',
    rol: 'Developer',
    email: 'juan.perez@empresa.com',
    habilidades: ['JavaScript', 'Node.js', 'Angular', 'MySQL', 'Git']
  },
  {
    id: uuidv4(),
    nombre: 'Ana López',
    rol: 'Tester',
    email: 'ana.lopez@empresa.com',
    habilidades: ['Testing manual', 'Automatización', 'Selenium', 'Casos de prueba']
  },
  {
    id: uuidv4(),
    nombre: 'Pedro Martínez',
    rol: 'Developer',
    email: 'pedro.martinez@empresa.com',
    habilidades: ['Python', 'Django', 'PostgreSQL', 'Docker', 'APIs REST']
  },
  {
    id: uuidv4(),
    nombre: 'Laura Sánchez',
    rol: 'Team Leader',
    email: 'laura.sanchez@empresa.com',
    habilidades: ['Gestión de proyectos', 'Metodologías ágiles', 'Coaching', 'Planificación']
  },
  {
    id: uuidv4(),
    nombre: 'Roberto García',
    rol: 'Business Analyst',
    email: 'roberto.garcia@empresa.com',
    habilidades: ['Modelado de procesos', 'BPMN', 'Análisis funcional', 'Stakeholder management']
  },
  {
    id: uuidv4(),
    nombre: 'Carmen Ruiz',
    rol: 'Tester',
    email: 'carmen.ruiz@empresa.com',
    habilidades: ['QA', 'Testing de performance', 'Cypress', 'Gestión de defectos']
  }
];

// Datos de prueba para categorías de timebox
const categoriasPrueba = [
  {
    id: uuidv4(),
    nombre: 'Investigación'
  },
  {
    id: uuidv4(),
    nombre: 'Construcción'
  },
  {
    id: uuidv4(),
    nombre: 'Evolución'
  },
  {
    id: uuidv4(),
    nombre: 'Experimentación'
  },
  {
    id: uuidv4(),
    nombre: 'Integración'
  }
];

async function insertarPersonas() {
  console.log('🔄 Insertando personas de prueba...');
  
  try {
    for (const persona of personasPrueba) {
      const sql = `
        INSERT INTO personas (id, nombre, rol, email, habilidades, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        nombre = VALUES(nombre),
        rol = VALUES(rol),
        email = VALUES(email),
        habilidades = VALUES(habilidades),
        updated_at = NOW()
      `;
      
      await executeQuery(sql, [
        persona.id,
        persona.nombre,
        persona.rol,
        persona.email,
        JSON.stringify(persona.habilidades)
      ]);
      
      console.log(`   ✅ Insertada: ${persona.nombre} (${persona.rol})`);
    }
    
    console.log(`✅ ${personasPrueba.length} personas insertadas correctamente\n`);
  } catch (error) {
    console.error('❌ Error insertando personas:', error);
    throw error;
  }
}

async function insertarCategorias() {
  console.log('🔄 Insertando categorías de timebox de prueba...');
  
  try {
    for (const categoria of categoriasPrueba) {
      const sql = `
        INSERT INTO timebox_categories (id, nombre, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        nombre = VALUES(nombre),
        updated_at = NOW()
      `;
      
      await executeQuery(sql, [
        categoria.id,
        categoria.nombre
      ]);
      
      console.log(`   ✅ Insertada: ${categoria.nombre}`);
    }
    
    console.log(`✅ ${categoriasPrueba.length} categorías insertadas correctamente\n`);
  } catch (error) {
    console.error('❌ Error insertando categorías:', error);
    throw error;
  }
}

async function verificarTablas() {
  console.log('🔍 Verificando existencia de tablas...');
  
  try {
    // Verificar tabla personas
    const personasCount = await executeQuery('SELECT COUNT(*) as total FROM personas');
    console.log(`   📊 Tabla personas: ${personasCount[0].total} registros existentes`);
    
    // Verificar tabla timebox_categories
    const categoriasCount = await executeQuery('SELECT COUNT(*) as total FROM timebox_categories');
    console.log(`   📊 Tabla timebox_categories: ${categoriasCount[0].total} registros existentes`);
    
    console.log('✅ Verificación de tablas completada\n');
  } catch (error) {
    console.error('❌ Error verificando tablas:', error);
    throw error;
  }
}

async function mostrarResumen() {
  console.log('📋 RESUMEN DE DATOS INSERTADOS:');
  console.log('================================');
  
  try {
    // Resumen de personas por rol
    const personasPorRol = await executeQuery(`
      SELECT rol, COUNT(*) as cantidad 
      FROM personas 
      WHERE rol IS NOT NULL 
      GROUP BY rol 
      ORDER BY cantidad DESC
    `);
    
    console.log('\n👥 PERSONAS POR ROL:');
    personasPorRol.forEach(row => {
      console.log(`   • ${row.rol}: ${row.cantidad} persona(s)`);
    });
    
    // Resumen de categorías de timebox
    const categoriasTimebox = await executeQuery(`
      SELECT nombre 
      FROM timebox_categories 
      ORDER BY nombre ASC
    `);
    
    console.log('\n📂 CATEGORÍAS DE TIMEBOX:');
    categoriasTimebox.forEach(row => {
      console.log(`   • ${row.nombre}`);
    });
    
    // Total general
    const totalPersonas = await executeQuery('SELECT COUNT(*) as total FROM personas');
    const totalCategorias = await executeQuery('SELECT COUNT(*) as total FROM timebox_categories');
    
    console.log('\n📊 TOTALES:');
    console.log(`   • Personas: ${totalPersonas[0].total}`);
    console.log(`   • Categorías: ${totalCategorias[0].total}`);
    
  } catch (error) {
    console.error('❌ Error generando resumen:', error);
  }
}

async function main() {
  try {
    console.log('🚀 INICIANDO INSERCIÓN DE DATOS DE PRUEBA');
    console.log('==========================================\n');
    
    // Verificar conexión y tablas
    await verificarTablas();
    
    // Insertar datos
    await insertarPersonas();
    await insertarCategorias();
    
    // Mostrar resumen
    await mostrarResumen();
    
    console.log('\n🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!');
    console.log('=====================================');
    console.log('✅ Todos los datos de prueba han sido insertados');
    console.log('✅ Las APIs /api/personas y /api/categories están listas para usar');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 ERROR EN EL PROCESO:', error.message);
    console.error('❌ El proceso ha fallado. Revisa la configuración de la base de datos.');
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}

module.exports = {
  insertarPersonas,
  insertarCategorias,
  verificarTablas,
  mostrarResumen,
  personasPrueba,
  categoriasPrueba
};