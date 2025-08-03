-- Crear tablas para las fases faltantes: refinement, qa, close

USE timebox_tracking;

-- Tabla para fase de refinement
CREATE TABLE IF NOT EXISTS refinement_phases (
  id VARCHAR(36) PRIMARY KEY,
  timebox_id VARCHAR(36) NOT NULL,
  fecha_fase DATE,
  completada TINYINT(1) DEFAULT 0,
  revisiones JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Tabla para fase de qa
CREATE TABLE IF NOT EXISTS qa_phases (
  id VARCHAR(36) PRIMARY KEY,
  timebox_id VARCHAR(36) NOT NULL,
  fecha_fase DATE,
  completada TINYINT(1) DEFAULT 0,
  estado_consolidacion VARCHAR(50),
  progreso_consolidacion INT DEFAULT 0,
  fecha_preparacion_entorno DATE,
  entorno_pruebas VARCHAR(100),
  version_despliegue VARCHAR(50),
  responsable_despliegue VARCHAR(100),
  observaciones_despliegue TEXT,
  plan_pruebas_url VARCHAR(500),
  resultados_pruebas TEXT,
  datos_adicionales JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Tabla para fase de close
CREATE TABLE IF NOT EXISTS close_phases (
  id VARCHAR(36) PRIMARY KEY,
  timebox_id VARCHAR(36) NOT NULL,
  fecha_fase DATE,
  completada TINYINT(1) DEFAULT 0,
  checklist JSON,
  adjuntos JSON,
  cumplimiento VARCHAR(20) DEFAULT 'Total',
  observaciones TEXT,
  aprobador VARCHAR(100),
  ev_madurez_aplicativo VARCHAR(100),
  mejoras JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Verificar las tablas creadas
SHOW TABLES LIKE '%_phases';