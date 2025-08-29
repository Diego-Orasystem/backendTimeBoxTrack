-- =====================================================
-- ACTUALIZACIÓN DE CONTRASEÑAS - TIMBOX TRACK
-- =====================================================
-- Ejecutar este script para actualizar las contraseñas hasheadas
-- y poder hacer login con los usuarios de prueba

USE timebox_tracking;

-- =====================================================
-- ACTUALIZAR CONTRASEÑAS DE USUARIOS DE PRUEBA
-- =====================================================

-- Usuario Administrador
UPDATE users SET password_hash = '$2a$10$/ILo0RyvxksmlmnwH1GAZOfFiEh0xKN1CriDSGTRraDBr5lNyrNtq' WHERE username = 'admin';

-- Usuario Business Sponsor
UPDATE users SET password_hash = '$2a$10$8b1Pmr3mWImqC7zUfMZGi.fZ0BnOd9JLBznyLtKfUMploa4jYpIy6' WHERE username = 'sponsor';

-- Usuario Project Manager
UPDATE users SET password_hash = '$2a$10$brASyRVUnCooI9sVECmvY.qIPLS3lMWQTzsLoDoJLAS8OK8c9wSnW' WHERE username = 'pm';

-- Usuario Team Leader
UPDATE users SET password_hash = '$2a$10$6MKk/I1qMmL0y6tDfa0jPuZJbFy/ZDOMXOvL34v3qZOWMRbCIor3a' WHERE username = 'teamlead';

-- Usuario Finance Approver
UPDATE users SET password_hash = '$2a$10$ZPjH1pN6SSpmahujsO7yBevhXf8/aq1GZDSIlOFv33t7eyYUGTSEO' WHERE username = 'finance';

-- Usuario Treasurer
UPDATE users SET password_hash = '$2a$10$Rg9lD0QkjnPGGJfYGC34NeipL9ZHw8yjI.C/Oi1nhtgmaTwFfYfxm' WHERE username = 'treasurer';

-- Usuario Business Analyst
UPDATE users SET password_hash = '$2a$10$6vtw5PrLlG602a.1Rc2nuu0uTQxOWK2Y9NWXbNb8vy5rvw0dG2YUG' WHERE username = 'analyst';

-- Usuario Solution Developer
UPDATE users SET password_hash = '$2a$10$naxOdch7JN9suEn9MxbVQeZT62/zDImnzwIU2i9pHXHnHEreDeBO.' WHERE username = 'developer';

-- Usuario Solution Tester
UPDATE users SET password_hash = '$2a$10$GSbOqs603WynsNqleFTQTORQsnzKuK78H/M0L63fAaqj6JXD6vCpy' WHERE username = 'tester';

-- Usuario Deployment Team
UPDATE users SET password_hash = '$2a$10$RGFXmGOw9lLfJ3HuS9gpXe8eBWW0wgXzEEpvGTSFNhuMJq6FIpYAC' WHERE username = 'deployment';

-- =====================================================
-- VERIFICAR ACTUALIZACIÓN
-- =====================================================

-- Mostrar usuarios actualizados
SELECT username, email, first_name, last_name, is_active FROM users ORDER BY username;

-- Contar usuarios actualizados
SELECT COUNT(*) as total_usuarios FROM users;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

SELECT '¡Contraseñas actualizadas exitosamente!' as mensaje;
SELECT 'Ahora puedes hacer login con admin/admin123, sponsor/sponsor123, etc.' as instruccion;
