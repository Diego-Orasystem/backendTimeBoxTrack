const express = require('express');
const { upload } = require('./controllers/uploadController');
const FinanceController = require('./controllers/financeController');

console.log('🔍 Probando importaciones...');

// Verificar que upload esté disponible
if (upload) {
  console.log('✅ upload middleware importado correctamente');
  console.log('📁 Tipo de upload:', typeof upload);
  console.log('🔧 Métodos disponibles:', Object.keys(upload));
} else {
  console.log('❌ upload middleware NO está disponible');
}

// Verificar que FinanceController esté disponible
if (FinanceController) {
  console.log('✅ FinanceController importado correctamente');
  console.log('📁 Tipo de FinanceController:', typeof FinanceController);
  console.log('🔧 Métodos disponibles:', Object.getOwnPropertyNames(FinanceController));
} else {
  console.log('❌ FinanceController NO está disponible');
}

// Verificar que upload.single esté disponible
if (upload && upload.single) {
  console.log('✅ upload.single está disponible');
} else {
  console.log('❌ upload.single NO está disponible');
}

console.log('\n🎯 Prueba completada');
