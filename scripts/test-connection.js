#!/usr/bin/env node

/**
 * Script para probar la conexión a la base de datos
 * Uso: node backend/scripts/test-connection.js
 */

require('dotenv').config();
const { executeQuery, testConnection } = require('../config/database');

async function testBasicConnection() {
  console.log('🔍 Probando conexión básica...');
  
  try {
    await testConnection();
    console.log('✅ Conexión exitosa');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
  return true;
}

async function testTables() {
  console.log('\n🔍 Verificando tablas requeridas...');
  
  const tablasRequeridas = ['personas', 'timebox_categories', 'timebox_types', 'projects', 'timeboxes'];
  
  for (const tabla of tablasRequeridas) {
    try {
      const result = await executeQuery(`SHOW TABLES LIKE '${tabla}'`);
      if (result.length > 0) {
        console.log(`✅ Tabla '${tabla}' existe`);
        
        // Mostrar conteo de registros
        const count = await executeQuery(`SELECT COUNT(*) as total FROM ${tabla}`);
        console.log(`   📊 Registros: ${count[0].total}`);
      } else {
        console.log(`❌ Tabla '${tabla}' NO existe`);
      }
    } catch (error) {
      console.log(`❌ Error verificando tabla '${tabla}': ${error.message}`);
    }
  }
  
  // Mostrar todas las tablas existentes
  console.log('\n📋 Todas las tablas en la base de datos:');
  try {
    const allTables = await executeQuery('SHOW TABLES');
    if (allTables.length > 0) {
      allTables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   • ${tableName}`);
      });
    } else {
      console.log('   (No hay tablas)');
    }
  } catch (error) {
    console.log(`❌ Error listando tablas: ${error.message}`);
  }
}

async function showDatabaseInfo() {
  console.log('\n📋 Información de la base de datos:');
  console.log('===================================');
  
  try {
    // Mostrar versión de MySQL
    const version = await executeQuery('SELECT VERSION() as version');
    console.log(`🔧 Versión MySQL: ${version[0].version}`);
    
    // Mostrar base de datos actual
    const database = await executeQuery('SELECT DATABASE() as db_name');
    console.log(`💾 Base de datos: ${database[0].db_name}`);
    
    // Mostrar configuración desde .env
    console.log(`🌐 Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`🔌 Puerto: ${process.env.DB_PORT || '3306'}`);
    console.log(`👤 Usuario: ${process.env.DB_USER || 'root'}`);
    
  } catch (error) {
    console.error('❌ Error obteniendo información:', error.message);
  }
}

async function main() {
  console.log('🚀 PRUEBA DE CONEXIÓN A BASE DE DATOS');
  console.log('======================================\n');
  
  // Probar conexión básica
  const connectionOk = await testBasicConnection();
  
  if (!connectionOk) {
    console.log('\n💡 SUGERENCIAS:');
    console.log('• Verifica que MySQL/MariaDB esté ejecutándose');
    console.log('• Revisa las credenciales en el archivo .env');
    console.log('• Confirma que la base de datos exista');
    process.exit(1);
  }
  
  // Mostrar información de la DB
  await showDatabaseInfo();
  
  // Verificar tablas
  await testTables();
  
  console.log('\n🎉 ¡Prueba de conexión completada!');
  console.log('==================================');
  
  process.exit(0);
}

main();