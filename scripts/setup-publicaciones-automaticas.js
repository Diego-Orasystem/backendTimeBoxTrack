const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupPublicacionesAutomaticas() {
  try {
    console.log('🚀 Configurando sistema de publicaciones automáticas...\n');

    // Leer el esquema SQL
    const schemaPath = path.join(__dirname, '../database/sql/publicaciones_automaticas_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('1️⃣ Creando tabla publicaciones_automaticas...');
    
    // Ejecutar el esquema SQL
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.executeQuery(statement);
          console.log('✅ Ejecutado:', statement.trim().substring(0, 50) + '...');
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('ℹ️  Tabla ya existe, continuando...');
          } else {
            console.error('❌ Error ejecutando statement:', error.message);
          }
        }
      }
    }

    console.log('\n2️⃣ Verificando estructura de la tabla...');
    
    try {
      const tableInfo = await db.executeQuery(`
        DESCRIBE publicaciones_automaticas
      `);
      
      console.log('✅ Tabla publicaciones_automaticas creada correctamente');
      console.log('📋 Columnas:');
      tableInfo.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
    } catch (error) {
      console.error('❌ Error verificando tabla:', error.message);
    }

    console.log('\n🎉 Sistema de publicaciones automáticas configurado exitosamente!');
    console.log('\n📚 Endpoints disponibles:');
    console.log('   - GET /api/publicaciones/:timeboxId/roles-disponibles');
    console.log('   - POST /api/publicaciones/:timeboxId/publicaciones-automaticas');
    console.log('   - PUT /api/publicaciones/:publicacionId/publicar');
    console.log('   - GET /api/publicaciones/:timeboxId/publicaciones');

  } catch (error) {
    console.error('❌ Error configurando publicaciones automáticas:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupPublicacionesAutomaticas();
}

module.exports = { setupPublicacionesAutomaticas };



