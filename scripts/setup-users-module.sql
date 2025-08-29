-- =====================================================
-- SCRIPT DE CONFIGURACIÓN DEL MÓDULO DE USUARIOS
-- Timebox Track - Sistema de Autenticación
-- =====================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS timebox_tracking;
USE timebox_tracking;

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla de usuarios
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de roles
CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    level VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de permisos
CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación usuario-rol
CREATE TABLE user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36) NULL,
    timebox_id VARCHAR(36) NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(36) NULL
);

-- Tabla de relación rol-permiso
CREATE TABLE role_permissions (
    id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(36) NULL
);

-- Tabla de refresh tokens
CREATE TABLE refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- Tabla de reset de contraseñas
CREATE TABLE password_resets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de actividades del usuario
CREATE TABLE user_activities (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id VARCHAR(36) NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones de usuario
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices para users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Índices para roles
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_level ON roles(level);

-- Índices para permissions
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);

-- Índices para user_roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_project_id ON user_roles(project_id);

-- Índices para role_permissions
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Índices para refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Índices para password_resets
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);

-- Índices para user_activities
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- Índices para user_sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

-- =====================================================
-- CLAVES FORÁNEAS
-- =====================================================

-- Claves foráneas para user_roles
ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_role_id 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

-- Claves foráneas para role_permissions
ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_role_id 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_permission_id 
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

-- Claves foráneas para refresh_tokens
ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Claves foráneas para password_resets
ALTER TABLE password_resets ADD CONSTRAINT fk_password_resets_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Claves foráneas para user_activities
ALTER TABLE user_activities ADD CONSTRAINT fk_user_activities_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Claves foráneas para user_sessions
ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================
-- RESTRICCIONES ÚNICAS
-- =====================================================

-- Restricción única para user_roles (usuario puede tener un rol por proyecto/timebox)
ALTER TABLE user_roles ADD CONSTRAINT unique_user_role_project_timebox 
    UNIQUE (user_id, role_id, project_id, timebox_id);

-- =====================================================
-- INSERCIÓN DE DATOS INICIALES
-- =====================================================

-- Insertar roles principales basados en AgilePM
INSERT INTO roles (id, name, description, level) VALUES
('role-001', 'Platform Administrator', 'Administrador de la plataforma con acceso completo', 'PLATFORM'),
('role-002', 'Business Sponsor', 'Patrocinador del negocio con acceso a proyectos y finanzas', 'PLATFORM'),
('role-003', 'Project Manager', 'Gerente de proyecto con acceso a gestión de proyectos', 'PROJECT'),
('role-004', 'Team Leader', 'Líder de equipo con acceso a gestión de equipo', 'TEAM'),
('role-005', 'Finance Approver', 'Aprobador financiero con acceso a finanzas', 'SUPPORT'),
('role-006', 'Treasurer', 'Tesorero con acceso a ejecución de pagos', 'SUPPORT'),
('role-007', 'Business Analyst', 'Analista de negocio con acceso a análisis', 'PLATFORM'),
('role-008', 'Solution Developer', 'Desarrollador de soluciones', 'TEAM'),
('role-009', 'Solution Tester', 'Probador de soluciones', 'TEAM'),
('role-010', 'Deployment Team', 'Equipo de despliegue', 'TEAM'),
('role-011', 'Project Support', 'Soporte del proyecto', 'SUPPORT'),
('role-012', 'Business Change Team', 'Equipo de cambio de negocio', 'PLATFORM'),
('role-013', 'Business Change Manager', 'Gerente de cambio de negocio', 'PROJECT'),
('role-014', 'Project Assurance', 'Aseguramiento del proyecto', 'SUPPORT'),
('role-015', 'Project Office', 'Oficina del proyecto', 'SUPPORT'),
('role-016', 'Stakeholder', 'Interesado del proyecto', 'SUPPORT');

-- Insertar permisos principales
INSERT INTO permissions (id, name, description, resource, action) VALUES
('perm-001', 'user:read', 'Leer información de usuarios', 'user', 'read'),
('perm-002', 'user:write', 'Crear y modificar usuarios', 'user', 'write'),
('perm-003', 'user:delete', 'Eliminar usuarios', 'user', 'delete'),
('perm-004', 'role:read', 'Leer información de roles', 'role', 'read'),
('perm-005', 'role:write', 'Crear y modificar roles', 'role', 'write'),
('perm-006', 'role:delete', 'Eliminar roles', 'role', 'delete'),
('perm-007', 'project:read', 'Leer información de proyectos', 'project', 'read'),
('perm-008', 'project:write', 'Crear y modificar proyectos', 'project', 'write'),
('perm-009', 'project:delete', 'Eliminar proyectos', 'project', 'delete'),
('perm-010', 'timebox:read', 'Leer información de timeboxes', 'timebox', 'read'),
('perm-011', 'timebox:write', 'Crear y modificar timeboxes', 'timebox', 'write'),
('perm-012', 'timebox:delete', 'Eliminar timeboxes', 'timebox', 'delete'),
('perm-013', 'team:read', 'Leer información de equipo', 'team', 'read'),
('perm-014', 'team:write', 'Crear y modificar equipo', 'team', 'write'),
('perm-015', 'team:delete', 'Eliminar equipo', 'team', 'delete'),
('perm-016', 'finance:read', 'Leer información financiera', 'finance', 'read'),
('perm-017', 'finance:write', 'Crear y modificar información financiera', 'finance', 'write'),
('perm-018', 'finance:delete', 'Eliminar información financiera', 'finance', 'delete'),
('perm-019', 'payment:approve', 'Aprobar pagos', 'payment', 'approve'),
('perm-020', 'payment:execute', 'Ejecutar pagos', 'payment', 'execute'),
('perm-021', 'delivery:read', 'Leer información de entregas', 'delivery', 'read'),
('perm-022', 'delivery:write', 'Crear y modificar entregas', 'delivery', 'write'),
('perm-023', 'delivery:delete', 'Eliminar entregas', 'delivery', 'delete'),
('perm-024', 'system:configure', 'Configurar sistema', 'system', 'configure');

-- Insertar usuarios de prueba con contraseñas hasheadas (admin123, sponsor123, pm123, etc.)
INSERT INTO users (id, username, email, password_hash, first_name, last_name, is_active, email_verified) VALUES
('user-001', 'admin', 'admin@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Admin', 'System', TRUE, TRUE),
('user-002', 'sponsor', 'sponsor@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Business', 'Sponsor', TRUE, TRUE),
('user-003', 'pm', 'pm@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Project', 'Manager', TRUE, TRUE),
('user-004', 'teamlead', 'teamlead@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Team', 'Leader', TRUE, TRUE),
('user-005', 'finance', 'finance@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Finance', 'Approver', TRUE, TRUE),
('user-006', 'treasurer', 'treasurer@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Treasurer', 'User', TRUE, TRUE),
('user-007', 'analyst', 'analyst@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Business', 'Analyst', TRUE, TRUE),
('user-008', 'developer', 'developer@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Solution', 'Developer', TRUE, TRUE),
('user-009', 'tester', 'tester@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Solution', 'Tester', TRUE, TRUE),
('user-010', 'deployment', 'deployment@timebox.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Deployment', 'Team', TRUE, TRUE);

-- Asignar roles a usuarios
INSERT INTO user_roles (id, user_id, role_id) VALUES
('ur-001', 'user-001', 'role-001'), -- admin -> Platform Administrator
('ur-002', 'user-002', 'role-002'), -- sponsor -> Business Sponsor
('ur-003', 'user-003', 'role-003'), -- pm -> Project Manager
('ur-004', 'user-004', 'role-004'), -- teamlead -> Team Leader
('ur-005', 'user-005', 'role-005'), -- finance -> Finance Approver
('ur-006', 'user-006', 'role-006'), -- treasurer -> Treasurer
('ur-007', 'user-007', 'role-007'), -- analyst -> Business Analyst
('ur-008', 'user-008', 'role-008'), -- developer -> Solution Developer
('ur-009', 'user-009', 'role-009'), -- tester -> Solution Tester
('ur-010', 'user-010', 'role-010'); -- deployment -> Deployment Team

-- Asignar permisos a roles
-- Platform Administrator (todos los permisos)
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-001', 'role-001', 'perm-001'), ('rp-002', 'role-001', 'perm-002'), ('rp-003', 'role-001', 'perm-003'),
('rp-004', 'role-001', 'perm-004'), ('rp-005', 'role-001', 'perm-005'), ('rp-006', 'role-001', 'perm-006'),
('rp-007', 'role-001', 'perm-007'), ('rp-008', 'role-001', 'perm-008'), ('rp-009', 'role-001', 'perm-009'),
('rp-010', 'role-001', 'perm-010'), ('rp-011', 'role-001', 'perm-011'), ('rp-012', 'role-001', 'perm-012'),
('rp-013', 'role-001', 'perm-013'), ('rp-014', 'role-001', 'perm-014'), ('rp-015', 'role-001', 'perm-015'),
('rp-016', 'role-001', 'perm-016'), ('rp-017', 'role-001', 'perm-017'), ('rp-018', 'role-001', 'perm-018'),
('rp-019', 'role-001', 'perm-019'), ('rp-020', 'role-001', 'perm-020'), ('rp-021', 'role-001', 'perm-021'),
('rp-022', 'role-001', 'perm-022'), ('rp-023', 'role-001', 'perm-023'), ('rp-024', 'role-001', 'perm-024');

-- Business Sponsor
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-025', 'role-002', 'perm-007'), ('rp-026', 'role-002', 'perm-008'), ('rp-027', 'role-002', 'perm-016'),
('rp-028', 'role-002', 'perm-017');

-- Project Manager
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-029', 'role-003', 'perm-007'), ('rp-030', 'role-003', 'perm-008'), ('rp-031', 'role-003', 'perm-010'),
('rp-032', 'role-003', 'perm-011'), ('rp-033', 'role-003', 'perm-013'), ('rp-034', 'role-003', 'perm-014');

-- Team Leader
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-035', 'role-004', 'perm-010'), ('rp-036', 'role-004', 'perm-011'), ('rp-037', 'role-004', 'perm-013'),
('rp-038', 'role-004', 'perm-014'), ('rp-039', 'role-004', 'perm-021'), ('rp-040', 'role-004', 'perm-022');

-- Finance Approver
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-041', 'role-005', 'perm-016'), ('rp-042', 'role-005', 'perm-017'), ('rp-043', 'role-005', 'perm-019');

-- Treasurer
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-044', 'role-006', 'perm-016'), ('rp-045', 'role-006', 'perm-017'), ('rp-046', 'role-006', 'perm-020');

-- Business Analyst
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-047', 'role-007', 'perm-007'), ('rp-048', 'role-007', 'perm-010'), ('rp-049', 'role-007', 'perm-016');

-- Solution Developer
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-050', 'role-008', 'perm-010'), ('rp-051', 'role-008', 'perm-011'), ('rp-052', 'role-008', 'perm-021'),
('rp-053', 'role-008', 'perm-022');

-- Solution Tester
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-054', 'role-009', 'perm-010'), ('rp-055', 'role-009', 'perm-021');

-- Deployment Team
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-056', 'role-010', 'perm-021'), ('rp-057', 'role-010', 'perm-022');

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

SELECT 'Módulo de usuarios configurado exitosamente!' as mensaje;
SELECT COUNT(*) as total_usuarios FROM users;
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as total_permisos FROM permissions;
