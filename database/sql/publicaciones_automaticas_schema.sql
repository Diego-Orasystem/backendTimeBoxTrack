-- Tabla de publicaciones automáticas
CREATE TABLE IF NOT EXISTS publicaciones_automaticas (
    id VARCHAR(36) PRIMARY KEY,
    timebox_id VARCHAR(36) NOT NULL,
    rol VARCHAR(100) NOT NULL,
    sueldo_semanal DECIMAL(10,2) DEFAULT 0.00,
    moneda VARCHAR(10) DEFAULT 'USD',
    semanas_proyecto INT DEFAULT 1,
    financiamiento_total DECIMAL(15,2) DEFAULT 0.00,
    publicado BOOLEAN DEFAULT FALSE,
    fecha_publicacion TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_publicaciones_timebox ON publicaciones_automaticas(timebox_id);
CREATE INDEX idx_publicaciones_rol ON publicaciones_automaticas(rol);
CREATE INDEX idx_publicaciones_publicado ON publicaciones_automaticas(publicado);
