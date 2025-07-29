-- Datos iniciales para la base de datos

-- Insertar datos de ejemplo para proyectos
INSERT INTO projects (name, description, status, created_at, updated_at) VALUES
('Proyecto Demo', 'Proyecto de demostración para testing', 'active', NOW(), NOW()),
('Proyecto Desarrollo', 'Proyecto de desarrollo de nuevas funcionalidades', 'active', NOW(), NOW()),
('Proyecto Mantenimiento', 'Proyecto de mantenimiento del sistema', 'active', NOW(), NOW());

-- Insertar datos de ejemplo para personas
INSERT INTO personas (name, email, role, status, created_at, updated_at) VALUES
('Juan Pérez', 'juan.perez@example.com', 'developer', 'active', NOW(), NOW()),
('María García', 'maria.garcia@example.com', 'manager', 'active', NOW(), NOW()),
('Carlos López', 'carlos.lopez@example.com', 'developer', 'active', NOW(), NOW());

-- Insertar datos de ejemplo para timeboxes
INSERT INTO timeboxes (project_id, persona_id, title, description, start_time, end_time, status, created_at, updated_at) VALUES
(1, 1, 'Desarrollo Frontend', 'Desarrollo de componentes React', '2024-01-15 09:00:00', '2024-01-15 17:00:00', 'completed', NOW(), NOW()),
(1, 2, 'Revisión de Código', 'Revisión de pull requests', '2024-01-16 10:00:00', '2024-01-16 12:00:00', 'in_progress', NOW(), NOW()),
(2, 3, 'Testing', 'Pruebas unitarias y de integración', '2024-01-17 14:00:00', '2024-01-17 18:00:00', 'planned', NOW(), NOW());

-- Insertar datos de ejemplo para timebox_maintainers
INSERT INTO timebox_maintainers (timebox_id, persona_id, action_type, description, created_at) VALUES
(1, 1, 'start', 'Iniciando desarrollo de componentes', NOW()),
(1, 1, 'pause', 'Pausa para almuerzo', NOW()),
(1, 1, 'resume', 'Reanudando trabajo', NOW()),
(1, 1, 'complete', 'Desarrollo completado', NOW()),
(2, 2, 'start', 'Iniciando revisión de código', NOW());

COMMIT;