-- Tablas de Finanzas

-- Órdenes de pago
CREATE TABLE IF NOT EXISTS ordenes_pago (
  id VARCHAR(36) PRIMARY KEY,
  developer_id VARCHAR(36) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  moneda VARCHAR(10) NOT NULL,
  concepto TEXT NULL,
  fecha_emision DATE NULL,
  estado ENUM('Pendiente','Aprobada','Pagada','Rechazada') DEFAULT 'Pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_op_dev (developer_id),
  INDEX idx_op_estado (estado)
);

-- Pagos efectuados al developer
CREATE TABLE IF NOT EXISTS pagos (
  id VARCHAR(36) PRIMARY KEY,
  developer_id VARCHAR(36) NOT NULL,
  orden_pago_id VARCHAR(36) NULL,
  monto DECIMAL(12,2) NOT NULL,
  moneda VARCHAR(10) NOT NULL,
  metodo VARCHAR(30) NULL,
  referencia VARCHAR(100) NULL,
  fecha_pago DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pagos_dev (developer_id),
  INDEX idx_pagos_orden (orden_pago_id)
);

-- Agregar columna financiamiento a kickoff_phases
ALTER TABLE kickoff_phases ADD COLUMN IF NOT EXISTS financiamiento JSON NULL;

-- Agregar columna compensacion_economica a kickoff_phases
ALTER TABLE kickoff_phases ADD COLUMN IF NOT EXISTS compensacion_economica JSON NULL;


