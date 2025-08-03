#!/usr/bin/env node

/**
 * Script rápido para insertar datos de prueba
 * Uso: node backend/scripts/quick-insert.js
 */

require('dotenv').config();
const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Función para insertar personas rápidamente
async function insertPersonasRapido() {
  const personas = [
    { nombre: 'Carlos Rodriguez', rol: 'Team Leader', email: 'carlos@test.com' },
    { nombre: 'María González', rol: 'Business Analyst', email: 'maria@test.com' },
    { nombre: 'Juan Pérez', rol: 'Developer', email: 'juan@test.com' },
    { nombre: 'Ana López', rol: 'Tester', email: 'ana@test.com' },
    { nombre: 'Pedro Martínez', rol: 'Developer', email: 'pedro@test.com' },
    { nombre: 'Laura Sánchez', rol: 'Team Leader', email: 'laura@test.com' }
  ];

  console.log('Insertando personas...');
  for (const p of personas) {
    await executeQuery(
      'INSERT INTO personas (id, nombre, rol, email) VALUES (?, ?, ?, ?)',
      [uuidv4(), p.nombre, p.rol, p.email]
    );
    console.log(`✓ ${p.nombre}`);
  }
}

// Función para insertar categorías de timebox rápidamente
async function insertCategoriasRapido() {
  const categorias = [
    { nombre: 'Investigación' },
    { nombre: 'Construcción' },
    { nombre: 'Evolución' },
    { nombre: 'Experimentación' },
    { nombre: 'Integración' }
  ];

  console.log('Insertando categorías de timebox...');
  for (const c of categorias) {
    await executeQuery(
      'INSERT INTO timebox_categories (id, nombre) VALUES (?, ?)',
      [uuidv4(), c.nombre]
    );
    console.log(`✓ ${c.nombre}`);
  }
}

async function main() {
  try {
    console.log('🚀 Insertando datos de prueba...\n');
    
    await insertPersonasRapido();
    console.log();
    await insertCategoriasRapido();
    
    console.log('\n✅ ¡Datos insertados correctamente!');
    
    // Mostrar conteos
    const personasCount = await executeQuery('SELECT COUNT(*) as total FROM personas');
    const categoriasCount = await executeQuery('SELECT COUNT(*) as total FROM timebox_categories');
    
    console.log(`\n📊 Resumen:`);
    console.log(`   Personas: ${personasCount[0].total}`);
    console.log(`   Categorías de Timebox: ${categoriasCount[0].total}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

main();