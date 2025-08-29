-- Tabla para sueldos base de roles
CREATE TABLE IF NOT EXISTS role_sueldos (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    role_id VARCHAR(36) NOT NULL,
    sueldo_base_semanal DECIMAL(10,2) DEFAULT 0.00,
    moneda VARCHAR(10) DEFAULT 'USD',
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
