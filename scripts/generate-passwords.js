const bcrypt = require('bcryptjs');

// Función para generar hash de contraseña
async function generatePasswordHash(password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

// Función principal
async function main() {
    console.log('🔐 Generando hashes de contraseñas para Timebox Track...\n');
    
    const users = [
        { username: 'admin', password: 'admin123' },
        { username: 'sponsor', password: 'sponsor123' },
        { username: 'pm', password: 'pm123' },
        { username: 'teamlead', password: 'team123' },
        { username: 'finance', password: 'finance123' },
        { username: 'treasurer', password: 'treasurer123' },
        { username: 'analyst', password: 'analyst123' },
        { username: 'developer', password: 'developer123' },
        { username: 'tester', password: 'tester123' },
        { username: 'deployment', password: 'deployment123' }
    ];
    
    console.log('📋 Hashes generados:');
    console.log('=====================================');
    
    for (const user of users) {
        const hash = await generatePasswordHash(user.password);
        console.log(`${user.username}: ${user.password} → ${hash}`);
    }
    
    console.log('\n📝 Comandos SQL para actualizar contraseñas:');
    console.log('=====================================');
    
    for (const user of users) {
        const hash = await generatePasswordHash(user.password);
        console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = '${user.username}';`);
    }
    
    console.log('\n✅ ¡Hashes generados exitosamente!');
    console.log('💡 Copia y pega los comandos UPDATE en tu base de datos');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generatePasswordHash };
