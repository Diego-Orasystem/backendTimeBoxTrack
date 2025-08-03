-- Agregar campos adicionales a la tabla kickoff_phases para guardar información completa de kickoff

USE timebox_tracking;

-- Agregar columnas para datos JSON
ALTER TABLE kickoff_phases 
ADD COLUMN team_movilization JSON AFTER completada,
ADD COLUMN participantes JSON AFTER team_movilization,
ADD COLUMN lista_acuerdos JSON AFTER participantes;

-- Verificar los cambios
DESCRIBE kickoff_phases;