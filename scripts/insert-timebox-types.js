#!/usr/bin/env node

/**
 * Script para insertar tipos de timebox básicos
 * Uso: node backend/scripts/insert-timebox-types.js
 */

require('dotenv').config();
const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Primero vamos a obtener las categorías existentes
async function getCategorias() {
  try {
    const categorias = await executeQuery('SELECT * FROM timebox_categories ORDER BY nombre');
    return categorias;
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error.message);
    return [];
  }
}

// Datos de tipos de timebox básicos
async function getTimeboxTypesBasicos() {
  const categorias = await getCategorias();
  
  if (categorias.length === 0) {
    console.log('⚠️  No hay categorías disponibles. Ejecuta primero el script de inserción de categorías.');
    return [];
  }

  // Usar la primera categoría disponible, o crear tipos para todas
  const categoriaInvestigacion = categorias.find(c => c.nombre === 'Investigación') || categorias[0];
  const categoriaConstruccion = categorias.find(c => c.nombre === 'Construcción') || categorias[0];
  const categoriaEvolucion = categorias.find(c => c.nombre === 'Evolución') || categorias[0];

  return [
    {
      id: uuidv4(),
      nombre: 'Análisis de Requisitos',
      definicion: 'Timebox enfocado en el análisis detallado de requisitos funcionales y no funcionales.',
      categoria_id: categoriaInvestigacion.id,
      entregablesComunes: ['Documento de requisitos', 'Casos de uso', 'Historias de usuario'],
      evidenciasCierre: ['Requisitos validados', 'Criterios de aceptación definidos']
    },
    {
      id: uuidv4(),
      nombre: 'Prototipo de UI/UX',
      definicion: 'Desarrollo de prototipos de interfaz de usuario y experiencia de usuario.',
      categoria_id: categoriaInvestigacion.id,
      entregablesComunes: ['Wireframes', 'Mockups', 'Prototipo interactivo'],
      evidenciasCierre: ['Prototipo validado', 'Feedback de usuarios']
    },
    {
      id: uuidv4(),
      nombre: 'Desarrollo Backend API',
      definicion: 'Implementación de servicios backend y APIs REST.',
      categoria_id: categoriaConstruccion.id,
      entregablesComunes: ['Código fuente', 'Documentación API', 'Tests unitarios'],
      evidenciasCierre: ['APIs funcionando', 'Tests pasando', 'Documentación actualizada']
    },
    {
      id: uuidv4(),
      nombre: 'Desarrollo Frontend',
      definicion: 'Implementación de interfaces de usuario y componentes frontend.',
      categoria_id: categoriaConstruccion.id,
      entregablesComunes: ['Componentes UI', 'Páginas web', 'Tests de integración'],
      evidenciasCierre: ['Interfaces funcionando', 'Tests E2E pasando', 'Responsive design']
    },
    {
      id: uuidv4(),
      nombre: 'Testing y QA',
      definicion: 'Pruebas exhaustivas del sistema y aseguramiento de calidad.',
      categoria_id: categoriaConstruccion.id,
      entregablesComunes: ['Plan de pruebas', 'Casos de prueba', 'Reporte de bugs'],
      evidenciasCierre: ['Pruebas ejecutadas', 'Bugs corregidos', 'Sistema validado']
    },
    {
      id: uuidv4(),
      nombre: 'Mejora de Performance',
      definicion: 'Optimización del rendimiento y escalabilidad del sistema.',
      categoria_id: categoriaEvolucion.id,
      entregablesComunes: ['Análisis de performance', 'Optimizaciones', 'Métricas'],
      evidenciasCierre: ['Performance mejorado', 'Métricas validadas', 'Sistema optimizado']
    }
  ];
}

async function insertarTimeboxTypes() {
  console.log('🔄 Insertando tipos de timebox...');
  
  const timeboxTypes = await getTimeboxTypesBasicos();
  
  if (timeboxTypes.length === 0) {
    console.log('❌ No se pueden crear tipos de timebox sin categorías.');
    return;
  }

  try {
    for (const tipo of timeboxTypes) {
      const sql = `
        INSERT INTO timebox_types (id, nombre, definicion, categoria_id, entregables_comunes, evidencias_cierre, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        nombre = VALUES(nombre),
        definicion = VALUES(definicion),
        categoria_id = VALUES(categoria_id),
        entregables_comunes = VALUES(entregables_comunes),
        evidencias_cierre = VALUES(evidencias_cierre),
        updated_at = NOW()
      `;
      
      await executeQuery(sql, [
        tipo.id,
        tipo.nombre,
        tipo.definicion,
        tipo.categoria_id,
        JSON.stringify(tipo.entregablesComunes),
        JSON.stringify(tipo.evidenciasCierre)
      ]);
      
      console.log(`   ✅ Insertado: ${tipo.nombre}`);
    }
    
    console.log(`✅ ${timeboxTypes.length} tipos de timebox insertados correctamente\n`);
  } catch (error) {
    console.error('❌ Error insertando tipos de timebox:', error);
    throw error;
  }
}

async function mostrarResumen() {
  console.log('📋 RESUMEN DE TIPOS DE TIMEBOX:');
  console.log('==============================');
  
  try {
    // Obtener tipos por categoría
    const tiposPorCategoria = await executeQuery(`
      SELECT tc.nombre as categoria, tt.nombre as tipo
      FROM timebox_types tt
      JOIN timebox_categories tc ON tt.categoria_id = tc.id
      ORDER BY tc.nombre, tt.nombre
    `);
    
    console.log('\n📂 TIPOS POR CATEGORÍA:');
    let categoriaActual = '';
    tiposPorCategoria.forEach(row => {
      if (row.categoria !== categoriaActual) {
        categoriaActual = row.categoria;
        console.log(`\n  📁 ${categoriaActual}:`);
      }
      console.log(`     • ${row.tipo}`);
    });
    
    // Total
    const total = await executeQuery('SELECT COUNT(*) as total FROM timebox_types');
    console.log(`\n📊 Total de tipos de timebox: ${total[0].total}`);
    
  } catch (error) {
    console.error('❌ Error generando resumen:', error);
  }
}

async function main() {
  try {
    console.log('🚀 INSERTANDO TIPOS DE TIMEBOX');
    console.log('===============================\n');
    
    // Verificar categorías existentes
    const categorias = await getCategorias();
    console.log(`📂 Categorías disponibles: ${categorias.length}`);
    categorias.forEach(cat => console.log(`   • ${cat.nombre}`));
    
    if (categorias.length === 0) {
      console.log('\n⚠️  Necesitas ejecutar primero:');
      console.log('   node backend/scripts/insert-test-data.js');
      console.log('   o');
      console.log('   node backend/scripts/quick-insert.js');
      return;
    }
    
    console.log('');
    
    // Insertar tipos
    await insertarTimeboxTypes();
    
    // Mostrar resumen
    await mostrarResumen();
    
    console.log('\n🎉 ¡TIPOS DE TIMEBOX LISTOS!');
    console.log('============================');
    console.log('✅ Ahora puedes crear timeboxes desde el frontend');
    console.log('✅ Los tipos están vinculados a las categorías existentes');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}

module.exports = {
  insertarTimeboxTypes,
  getTimeboxTypesBasicos,
  getCategorias,
  mostrarResumen
};