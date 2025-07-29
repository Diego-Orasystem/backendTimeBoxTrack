const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let createdProjectId = null;
let createdContentId = null;
let createdTimeboxId = null;

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, data = null, expectedStatus = 200, baseUrl = BASE_URL) {
  try {
    log(`\n🔍 Probando: ${name}`, 'blue');
    log(`   ${method} ${url}`, 'yellow');
    
    const config = {
      method,
      url: `${baseUrl}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
      log(`   Body: ${JSON.stringify(data, null, 2)}`, 'yellow');
    }
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      log(`✅ ${name} - EXITOSO (${response.status})`, 'green');
      return response.data;
    } else {
      log(`❌ ${name} - FALLÓ. Esperado: ${expectedStatus}, Obtenido: ${response.status}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ ${name} - ERROR: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return null;
  }
}

async function runTests() {
  log('🚀 INICIANDO PRUEBAS DEL BACKEND', 'blue');
  log('================================', 'blue');
  
  // 1. Pruebas de conectividad
  log('\n📡 PRUEBAS DE CONECTIVIDAD', 'blue');
  await testEndpoint('Health Check', 'GET', '/health', null, 200, 'http://localhost:3000');
  await testEndpoint('API Info', 'GET', '');
  
  // 2. Pruebas de proyectos
  log('\n📁 PRUEBAS DE PROYECTOS', 'blue');
  
  // Obtener todos los proyectos (debería estar vacío inicialmente)
  await testEndpoint('Obtener todos los proyectos', 'GET', '/project/all');
  
  // Crear proyecto
  const projectData = {
    nombre: 'Proyecto de Pruebas Automatizadas',
    descripcion: 'Proyecto creado por el script de pruebas'
  };
  const createdProject = await testEndpoint('Crear proyecto', 'POST', '/project', projectData, 201);
  
  if (createdProject && createdProject.data) {
    createdProjectId = createdProject.data.id;
    log(`   Proyecto creado con ID: ${createdProjectId}`, 'green');
    
    // Obtener proyecto por ID
    await testEndpoint('Obtener proyecto por ID', 'GET', `/project/${createdProjectId}`);
    
    // Obtener proyecto con contenido
    await testEndpoint('Obtener proyecto con contenido', 'GET', `/project/${createdProjectId}/content`);
    
    // Actualizar proyecto
    const updateData = {
      nombre: 'Proyecto Actualizado',
      descripcion: 'Descripción actualizada'
    };
    await testEndpoint('Actualizar proyecto', 'PUT', `/project/${createdProjectId}`, updateData);
  }
  
  // 3. Pruebas de contenido
  log('\n📄 PRUEBAS DE CONTENIDO', 'blue');
  
  if (createdProjectId) {
    // Crear carpeta raíz
    const folderData = {
      nombre: 'Carpeta Principal',
      tipo: 'Carpeta',
      descripcion: 'Carpeta raíz del proyecto',
      projectId: createdProjectId,
      parentId: null
    };
    const createdFolder = await testEndpoint('Crear carpeta raíz', 'POST', '/project/content', folderData, 201);
    
    if (createdFolder && createdFolder.data) {
      createdContentId = createdFolder.data.id;
      log(`   Carpeta creada con ID: ${createdContentId}`, 'green');
      
      // Obtener contenido de la carpeta
      await testEndpoint('Obtener contenido de carpeta', 'GET', `/project/content/${createdContentId}`);
      
      // Crear subcarpeta
      const subfolderData = {
        nombre: 'Subcarpeta',
        tipo: 'Carpeta',
        descripcion: 'Subcarpeta dentro de la carpeta principal',
        projectId: createdProjectId,
        parentId: createdContentId
      };
      const createdSubfolder = await testEndpoint('Crear subcarpeta', 'POST', '/project/content', subfolderData, 201);
      
      if (createdSubfolder && createdSubfolder.data) {
        log(`   Subcarpeta creada con ID: ${createdSubfolder.data.id}`, 'green');
        
        // Crear documento
        const documentData = {
          nombre: 'Documento de Prueba',
          tipo: 'Documento',
          descripcion: 'Documento de prueba en la subcarpeta',
          projectId: createdProjectId,
          parentId: createdSubfolder.data.id
        };
        await testEndpoint('Crear documento', 'POST', '/project/content', documentData, 201);
      }
      
      // Crear video
      const videoData = {
        nombre: 'Video de Prueba',
        tipo: 'Video',
        descripcion: 'Video de prueba en la carpeta principal',
        projectId: createdProjectId,
        parentId: createdContentId
      };
      await testEndpoint('Crear video', 'POST', '/project/content', videoData, 201);
      
      // Crear imagen
      const imageData = {
        nombre: 'Imagen de Prueba',
        tipo: 'Imagen',
        descripcion: 'Imagen de prueba en la carpeta principal',
        projectId: createdProjectId,
        parentId: createdContentId
      };
      await testEndpoint('Crear imagen', 'POST', '/project/content', imageData, 201);
    }
  }
  
  // 4. Pruebas de timeboxes
  log('\n⏰ PRUEBAS DE TIMEBOXES', 'blue');
  
  if (createdProjectId) {
    // Primero crear categoría y tipo de timebox para las pruebas
    log('\n📋 Creando datos de prueba para timeboxes...', 'yellow');
    
    // Crear categoría de timebox
    const categoryData = {
      id: 'test-category-id',
      nombre: 'Categoría de Prueba'
    };
    await testEndpoint('Crear categoría de timebox', 'POST', '/timebox/maintainer/categories', categoryData, 201);
    
    // Crear tipo de timebox
    const typeData = {
      id: 'test-type-id',
      nombre: 'Tipo de Prueba',
      definicion: 'Tipo de timebox para pruebas',
      categoriaId: 'test-category-id',
      entregablesComunes: ['Entregable 1', 'Entregable 2'],
      evidenciasCierre: ['Evidencia 1', 'Evidencia 2']
    };
    await testEndpoint('Crear tipo de timebox', 'POST', '/timebox/maintainer/types', typeData, 201);
    
    // Crear timebox
    const timeboxData = {
      tipoTimeboxId: 'test-type-id',
      projectId: createdProjectId,
      estado: 'En Definición',
      monto: 1000
    };
    const createdTimebox = await testEndpoint('Crear timebox', 'POST', `/project/${createdProjectId}/timeboxes`, timeboxData, 201);
    
    if (createdTimebox && createdTimebox.data) {
      createdTimeboxId = createdTimebox.data.id;
      log(`   Timebox creado con ID: ${createdTimeboxId}`, 'green');
      
      // Obtener timeboxes del proyecto
      await testEndpoint('Obtener timeboxes del proyecto', 'GET', `/project/${createdProjectId}/timeboxes`);
      
      // Obtener timebox específico
      await testEndpoint('Obtener timebox específico', 'GET', `/project/${createdProjectId}/timeboxes/${createdTimeboxId}`);
      
      // Actualizar timebox
      const updateTimeboxData = {
        estado: 'Disponible',
        monto: 1500
      };
      await testEndpoint('Actualizar timebox', 'PUT', `/project/${createdProjectId}/timeboxes/${createdTimeboxId}`, updateTimeboxData);
    }
  }
  
  // 5. Pruebas de limpieza (opcional)
  log('\n🧹 PRUEBAS DE LIMPIEZA', 'blue');
  
  if (createdTimeboxId && createdProjectId) {
    await testEndpoint('Eliminar timebox', 'DELETE', `/project/${createdProjectId}/timeboxes/${createdTimeboxId}`);
  }
  
  if (createdContentId) {
    await testEndpoint('Eliminar contenido', 'DELETE', `/project/content/${createdContentId}`);
  }
  
  if (createdProjectId) {
    await testEndpoint('Eliminar proyecto', 'DELETE', `/project/${createdProjectId}`);
  }
  
  log('\n🎉 PRUEBAS COMPLETADAS', 'green');
  log('========================', 'green');
}

// Ejecutar las pruebas
runTests().catch(error => {
  log(`❌ Error general: ${error.message}`, 'red');
  process.exit(1);
}); 