-- Script para actualizar el ENUM de la tabla project_content
-- Cambiar 'Imágen' por 'Imagen' para evitar problemas con caracteres especiales

USE timebox_tracking;

-- Primero, actualizar cualquier registro existente que use 'Imágen'
UPDATE project_content SET tipo = 'Imagen' WHERE tipo = 'Imágen';

-- Luego, modificar la columna para usar el nuevo ENUM
ALTER TABLE project_content MODIFY COLUMN tipo ENUM('Carpeta', 'Documento', 'Video', 'Imagen') NOT NULL; 