# Configuración de Tablas de Finanzas

## Descripción
Este documento explica cómo configurar las tablas necesarias para el sistema de finanzas y órdenes de pago automáticas.

## Tablas Requeridas

### 1. Tabla `ordenes_pago`
```sql
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
```

### 2. Tabla `pagos`
```sql
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
```

### 3. Verificar columnas en `kickoff_phases`
```sql
-- Verificar que estas columnas existan
ALTER TABLE kickoff_phases ADD COLUMN IF NOT EXISTS financiamiento JSON NULL;
ALTER TABLE kickoff_phases ADD COLUMN IF NOT EXISTS compensacion_economica JSON NULL;
```

## Cómo Ejecutar

1. **Conectar a la base de datos MySQL**
2. **Ejecutar cada comando CREATE TABLE**
3. **Verificar que las tablas se crearon correctamente**

## Funcionalidad

Una vez configuradas las tablas, el sistema automáticamente:

1. **Detecta** cuando se aprueba una postulación
2. **Calcula** el monto del anticipo basado en el `porcentajeAnticipado` del financiamiento
3. **Crea** una orden de pago en estado "Pendiente"
4. **Registra** el pago en la tabla de tracking
5. **Muestra** la orden en "Mis Pagos" del developer

## Ejemplo de Flujo

1. Developer postula a un timebox
2. Admin aprueba la postulación
3. Sistema calcula: `montoAnticipo = montoBase * (porcentajeAnticipado / 100)`
4. Se crea orden de pago automáticamente
5. Developer ve la orden en "Mis Pagos"
6. Admin puede aprobar/rechazar la orden
7. Una vez aprobada, se puede marcar como pagada
