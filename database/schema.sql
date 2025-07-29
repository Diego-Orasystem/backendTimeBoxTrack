-- Crear base de datos
CREATE DATABASE IF NOT EXISTS timebox_tracking;
USE timebox_tracking;

-- Tabla de categorías de timebox
CREATE TABLE IF NOT EXISTS timebox_categories (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de tipos de timebox
CREATE TABLE IF NOT EXISTS timebox_types (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    definicion TEXT,
    categoria_id VARCHAR(36) NOT NULL,
    entregables_comunes JSON,
    evidencias_cierre JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES timebox_categories(id) ON DELETE CASCADE
);

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de personas
CREATE TABLE IF NOT EXISTS personas (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(100),
    email VARCHAR(255),
    habilidades JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de timeboxes
CREATE TABLE IF NOT EXISTS timeboxes (
    id VARCHAR(36) PRIMARY KEY,
    tipo_timebox_id VARCHAR(36) NOT NULL,
    business_analyst_id VARCHAR(36),
    project_id VARCHAR(36) NOT NULL,
    monto DECIMAL(15,2),
    estado ENUM('En Definicion', 'Disponible', 'En Ejecucion', 'Finalizado') DEFAULT 'En Definicion',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_timebox_id) REFERENCES timebox_types(id),
    FOREIGN KEY (business_analyst_id) REFERENCES personas(id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tabla de fases de planning
CREATE TABLE IF NOT EXISTS planning_phases (
    id VARCHAR(36) PRIMARY KEY,
    timebox_id VARCHAR(36) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    fecha_fase DATE,
    eje VARCHAR(100),
    aplicativo VARCHAR(100),
    alcance VARCHAR(100),
    esfuerzo VARCHAR(100),
    fecha_inicio DATE,
    team_leader_id VARCHAR(36),
    completada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE,
    FOREIGN KEY (team_leader_id) REFERENCES personas(id)
);

-- Tabla de skills para planning
CREATE TABLE IF NOT EXISTS planning_skills (
    id VARCHAR(36) PRIMARY KEY,
    planning_id VARCHAR(36) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (planning_id) REFERENCES planning_phases(id) ON DELETE CASCADE
);

-- Tabla de adjuntos
CREATE TABLE IF NOT EXISTS adjuntos (
    id VARCHAR(36) PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación planning-adjuntos
CREATE TABLE IF NOT EXISTS planning_adjuntos (
    planning_id VARCHAR(36) NOT NULL,
    adjunto_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (planning_id, adjunto_id),
    FOREIGN KEY (planning_id) REFERENCES planning_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (adjunto_id) REFERENCES adjuntos(id) ON DELETE CASCADE
);

-- Tabla de checklist
CREATE TABLE IF NOT EXISTS checklists (
    id VARCHAR(36) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación planning-checklist
CREATE TABLE IF NOT EXISTS planning_checklists (
    planning_id VARCHAR(36) NOT NULL,
    checklist_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (planning_id, checklist_id),
    FOREIGN KEY (planning_id) REFERENCES planning_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Tabla de fases kickoff
CREATE TABLE IF NOT EXISTS kickoff_phases (
    id VARCHAR(36) PRIMARY KEY,
    timebox_id VARCHAR(36) NOT NULL,
    fecha_fase DATE,
    completada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Tabla de team mobilization
CREATE TABLE IF NOT EXISTS team_movilization (
    id VARCHAR(36) PRIMARY KEY,
    kickoff_id VARCHAR(36) NOT NULL,
    business_ambassador_id VARCHAR(36),
    solution_developer_id VARCHAR(36),
    solution_tester_id VARCHAR(36),
    business_advisor_id VARCHAR(36),
    technical_advisor_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kickoff_id) REFERENCES kickoff_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (business_ambassador_id) REFERENCES personas(id),
    FOREIGN KEY (solution_developer_id) REFERENCES personas(id),
    FOREIGN KEY (solution_tester_id) REFERENCES personas(id),
    FOREIGN KEY (business_advisor_id) REFERENCES personas(id),
    FOREIGN KEY (technical_advisor_id) REFERENCES personas(id)
);

-- Tabla de participantes kickoff
CREATE TABLE IF NOT EXISTS kickoff_participantes (
    kickoff_id VARCHAR(36) NOT NULL,
    persona_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (kickoff_id, persona_id),
    FOREIGN KEY (kickoff_id) REFERENCES kickoff_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

-- Tabla de relación kickoff-adjuntos
CREATE TABLE IF NOT EXISTS kickoff_adjuntos (
    kickoff_id VARCHAR(36) NOT NULL,
    adjunto_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (kickoff_id, adjunto_id),
    FOREIGN KEY (kickoff_id) REFERENCES kickoff_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (adjunto_id) REFERENCES adjuntos(id) ON DELETE CASCADE
);

-- Tabla de relación kickoff-checklist
CREATE TABLE IF NOT EXISTS kickoff_checklists (
    kickoff_id VARCHAR(36) NOT NULL,
    checklist_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (kickoff_id, checklist_id),
    FOREIGN KEY (kickoff_id) REFERENCES kickoff_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Tabla de fases refinement
CREATE TABLE IF NOT EXISTS refinement_phases (
    id VARCHAR(36) PRIMARY KEY,
    timebox_id VARCHAR(36) NOT NULL,
    completada BOOLEAN DEFAULT FALSE,
    fecha_fase DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Tabla de solicitudes de revisión
CREATE TABLE IF NOT EXISTS solicitudes_revision (
    id VARCHAR(36) PRIMARY KEY,
    refinement_id VARCHAR(36) NOT NULL,
    tipo ENUM('Revision', 'Cierre') NOT NULL,
    fecha_solicitud DATE NOT NULL,
    horario_disponibilidad JSON,
    completada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (refinement_id) REFERENCES refinement_phases(id) ON DELETE CASCADE
);

-- Tabla de participantes solicitud revisión
CREATE TABLE IF NOT EXISTS solicitud_participantes (
    solicitud_id VARCHAR(36) NOT NULL,
    persona_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (solicitud_id, persona_id),
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_revision(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

-- Tabla de relación solicitud-adjuntos
CREATE TABLE IF NOT EXISTS solicitud_adjuntos (
    solicitud_id VARCHAR(36) NOT NULL,
    adjunto_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (solicitud_id, adjunto_id),
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_revision(id) ON DELETE CASCADE,
    FOREIGN KEY (adjunto_id) REFERENCES adjuntos(id) ON DELETE CASCADE
);

-- Tabla de relación solicitud-checklist
CREATE TABLE IF NOT EXISTS solicitud_checklists (
    solicitud_id VARCHAR(36) NOT NULL,
    checklist_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (solicitud_id, checklist_id),
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_revision(id) ON DELETE CASCADE,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Tabla de fases QA
CREATE TABLE IF NOT EXISTS qa_phases (
    id VARCHAR(36) PRIMARY KEY,
    timebox_id VARCHAR(36) NOT NULL,
    fecha_fase DATE,
    estado_consolidacion ENUM('Pendiente', 'En Progreso', 'Completado', 'Bloqueado') DEFAULT 'Pendiente',
    progreso_consolidacion INT DEFAULT 0,
    fecha_preparacion_entorno DATE,
    entorno_pruebas VARCHAR(100),
    version_despliegue VARCHAR(50),
    responsable_despliegue VARCHAR(100),
    observaciones_despliegue TEXT,
    plan_pruebas_url VARCHAR(500),
    resultados_pruebas TEXT,
    bugs_identificados TEXT,
    url_bugs VARCHAR(500),
    responsable_qa VARCHAR(100),
    fecha_inicio_uat DATE,
    fecha_fin_uat DATE,
    estado_uat ENUM('Pendiente', 'En Progreso', 'Aprobado', 'Rechazado') DEFAULT 'Pendiente',
    responsable_uat VARCHAR(100),
    feedback_uat TEXT,
    completada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Tabla de relación QA-adjuntos
CREATE TABLE IF NOT EXISTS qa_adjuntos (
    qa_id VARCHAR(36) NOT NULL,
    adjunto_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (qa_id, adjunto_id),
    FOREIGN KEY (qa_id) REFERENCES qa_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (adjunto_id) REFERENCES adjuntos(id) ON DELETE CASCADE
);

-- Tabla de entregas
CREATE TABLE IF NOT EXISTS entregas (
    id VARCHAR(36) PRIMARY KEY,
    timebox_id VARCHAR(36) NOT NULL,
    fecha_entrega DATE,
    responsable VARCHAR(100),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Tabla de participantes entrega
CREATE TABLE IF NOT EXISTS entrega_participantes (
    entrega_id VARCHAR(36) NOT NULL,
    persona_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (entrega_id, persona_id),
    FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

-- Tabla de relación entrega-adjuntos entregables
CREATE TABLE IF NOT EXISTS entrega_adjuntos_entregables (
    entrega_id VARCHAR(36) NOT NULL,
    adjunto_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (entrega_id, adjunto_id),
    FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
    FOREIGN KEY (adjunto_id) REFERENCES adjuntos(id) ON DELETE CASCADE
);

-- Tabla de relación entrega-adjuntos evidencias
CREATE TABLE IF NOT EXISTS entrega_adjuntos_evidencias (
    entrega_id VARCHAR(36) NOT NULL,
    adjunto_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (entrega_id, adjunto_id),
    FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
    FOREIGN KEY (adjunto_id) REFERENCES adjuntos(id) ON DELETE CASCADE
);

-- Tabla de fases close
CREATE TABLE IF NOT EXISTS close_phases (
    id VARCHAR(36) PRIMARY KEY,
    timebox_id VARCHAR(36) NOT NULL,
    fecha_fase DATE,
    cumplimiento ENUM('Total', 'Parcial') DEFAULT 'Total',
    observaciones TEXT,
    aprobador VARCHAR(100),
    ev_madurez_aplicativo TEXT,
    completada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Tabla de mejoras
CREATE TABLE IF NOT EXISTS mejoras (
    id VARCHAR(36) PRIMARY KEY,
    close_id VARCHAR(36) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (close_id) REFERENCES close_phases(id) ON DELETE CASCADE
);

-- Tabla de relación close-adjuntos
CREATE TABLE IF NOT EXISTS close_adjuntos (
    close_id VARCHAR(36) NOT NULL,
    adjunto_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (close_id, adjunto_id),
    FOREIGN KEY (close_id) REFERENCES close_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (adjunto_id) REFERENCES adjuntos(id) ON DELETE CASCADE
);

-- Tabla de relación close-checklist
CREATE TABLE IF NOT EXISTS close_checklists (
    close_id VARCHAR(36) NOT NULL,
    checklist_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (close_id, checklist_id),
    FOREIGN KEY (close_id) REFERENCES close_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Tabla de publicación de ofertas
CREATE TABLE IF NOT EXISTS publicacion_ofertas (
    id VARCHAR(36) PRIMARY KEY,
    timebox_id VARCHAR(36) NOT NULL,
    solicitado BOOLEAN DEFAULT FALSE,
    publicado BOOLEAN DEFAULT FALSE,
    fecha_publicacion DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timebox_id) REFERENCES timeboxes(id) ON DELETE CASCADE
);

-- Tabla de postulaciones
CREATE TABLE IF NOT EXISTS postulaciones (
    id VARCHAR(36) PRIMARY KEY,
    publicacion_id VARCHAR(36) NOT NULL,
    rol VARCHAR(100) NOT NULL,
    desarrollador VARCHAR(100) NOT NULL,
    fecha_postulacion DATE NOT NULL,
    estado_solicitud VARCHAR(50) DEFAULT 'Pendiente',
    asignado BOOLEAN DEFAULT FALSE,
    fecha_asignacion DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (publicacion_id) REFERENCES publicacion_ofertas(id) ON DELETE CASCADE
);

-- Tabla de contenido de proyectos
CREATE TABLE IF NOT EXISTS project_content (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    tipo ENUM('Carpeta', 'Documento', 'Video', 'Imagen') NOT NULL,
    descripcion TEXT,
    parent_id VARCHAR(36),
    adjunto_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES project_content(id) ON DELETE CASCADE,
    FOREIGN KEY (adjunto_id) REFERENCES adjuntos(id) ON DELETE SET NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_timeboxes_project_id ON timeboxes(project_id);
CREATE INDEX idx_timeboxes_estado ON timeboxes(estado);
CREATE INDEX idx_planning_timebox_id ON planning_phases(timebox_id);
CREATE INDEX idx_kickoff_timebox_id ON kickoff_phases(timebox_id);
CREATE INDEX idx_refinement_timebox_id ON refinement_phases(timebox_id);
CREATE INDEX idx_qa_timebox_id ON qa_phases(timebox_id);
CREATE INDEX idx_close_timebox_id ON close_phases(timebox_id);
CREATE INDEX idx_entrega_timebox_id ON entregas(timebox_id);
CREATE INDEX idx_project_content_project_id ON project_content(project_id);
CREATE INDEX idx_project_content_parent_id ON project_content(parent_id); 