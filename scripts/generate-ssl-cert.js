const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generando certificados SSL para desarrollo...');

// Crear directorio ssl si no existe
const sslDir = path.join(__dirname, '..', 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
  console.log('📁 Directorio ssl/ creado');
}

try {
  // Generar clave privada
  console.log('🔑 Generando clave privada...');
  execSync(`openssl genrsa -out ${path.join(sslDir, 'key.pem')} 2048`, { stdio: 'inherit' });
  
  // Generar certificado autofirmado
  console.log('📜 Generando certificado autofirmado...');
  execSync(`openssl req -new -x509 -key ${path.join(sslDir, 'key.pem')} -out ${path.join(sslDir, 'cert.pem')} -days 365 -subj "/C=CL/ST=Chile/L=Santiago/O=Timebox/OU=IT/CN=10.90.0.190"`, { stdio: 'inherit' });
  
  console.log('✅ Certificados SSL generados exitosamente!');
  console.log('📁 Ubicación: ssl/cert.pem y ssl/key.pem');
  console.log('⚠️  NOTA: Estos son certificados autofirmados para desarrollo.');
  console.log('   Para producción, use certificados de una CA confiable.');
  
} catch (error) {
  console.error('❌ Error generando certificados SSL:', error.message);
  console.log('💡 Asegúrate de tener OpenSSL instalado en tu sistema.');
  console.log('   En Windows, puedes instalarlo desde: https://slproweb.com/products/Win32OpenSSL.html');
}
