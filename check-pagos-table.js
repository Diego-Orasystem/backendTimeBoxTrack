const { executeQuery } = require('./config/database');

async function checkPagosTable() {
  try {
    console.log('🔍 Verificando estructura de la tabla pagos...\n');

    // 1. Verificar estructura actual
    console.log('📋 1. Estructura actual de la tabla pagos:');
    const estructura = await executeQuery('DESCRIBE pagos');
    console.log(estructura);
    console.log('');

    // 2. Verificar si existen los campos de archivo
    const camposArchivo = ['archivo_url', 'archivo_tipo', 'archivo_size'];
    const camposExistentes = estructura.map(campo => campo.Field);
    
    console.log('📁 2. Campos existentes:', camposExistentes);
    console.log('📁 3. Campos de archivo necesarios:', camposArchivo);
    
    const camposFaltantes = camposArchivo.filter(campo => !camposExistentes.includes(campo));
    console.log('❌ 4. Campos faltantes:', camposFaltantes);

    // 3. Agregar campos faltantes
    if (camposFaltantes.length > 0) {
      console.log('\n🔧 5. Agregando campos faltantes...');
      
      for (const campo of camposFaltantes) {
        let sql = '';
        switch (campo) {
          case 'archivo_url':
            sql = 'ALTER TABLE pagos ADD COLUMN archivo_url VARCHAR(500) NULL COMMENT "URL del archivo del comprobante"';
            break;
          case 'archivo_tipo':
            sql = 'ALTER TABLE pagos ADD COLUMN archivo_tipo VARCHAR(100) NULL COMMENT "Tipo de archivo (PDF, JPG, etc.)"';
            break;
          case 'archivo_size':
            sql = 'ALTER TABLE pagos ADD COLUMN archivo_size BIGINT NULL COMMENT "Tamaño del archivo en bytes"';
            break;
        }
        
        if (sql) {
          console.log(`  Agregando campo ${campo}...`);
          await executeQuery(sql);
          console.log(`  ✅ Campo ${campo} agregado exitosamente`);
        }
      }
      
      // 4. Verificar estructura después de los cambios
      console.log('\n📋 6. Nueva estructura de la tabla pagos:');
      const nuevaEstructura = await executeQuery('DESCRIBE pagos');
      console.log(nuevaEstructura);
      
    } else {
      console.log('\n✅ Todos los campos de archivo ya existen en la tabla pagos');
    }

    // 5. Verificar datos existentes
    console.log('\n💰 7. Verificando datos existentes:');
    const pagosExistentes = await executeQuery('SELECT COUNT(*) as total FROM pagos');
    console.log('Total de pagos en la tabla:', pagosExistentes[0].total);
    
    if (pagosExistentes[0].total > 0) {
      const muestra = await executeQuery('SELECT id, metodo, archivo_url, archivo_tipo, archivo_size FROM pagos LIMIT 3');
      console.log('Muestra de pagos:', muestra);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkPagosTable();
