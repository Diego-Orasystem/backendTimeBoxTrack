# Actualización de Niveles de Roles

## Problema Identificado

Los roles en la base de datos tienen niveles que no coinciden con los valores esperados por el frontend:

- **Frontend espera**: `PLATFORM`, `PROJECT`, `TEAM`, `SUPPORT`
- **Base de datos tiene**: `admin`, `business`, `management`, `team`, `finance`, `technical`, `support`, `assurance`, `stakeholder`

Esto causa que se muestren "(0)" en lugar de los niveles correctos en el dropdown de roles.

## Solución

### Opción 1: Script de Node.js (Recomendado)

```bash
cd backend
npm run update-roles
```

### Opción 2: Script SQL Directo

```bash
cd backend/scripts
mysql -u [usuario] -p [base_datos] < update-role-levels.sql
```

### Opción 3: Ejecutar Manualmente

```bash
cd backend
node scripts/update-role-levels.js
```

## Mapeo de Niveles

| Rol | Nivel Anterior | Nivel Nuevo |
|-----|----------------|-------------|
| Platform Administrator | admin | PLATFORM |
| Business Sponsor | business | PLATFORM |
| Project Manager | management | PROJECT |
| Team Leader | team | TEAM |
| Finance Approver | finance | SUPPORT |
| Treasurer | finance | SUPPORT |
| Business Analyst | business | PLATFORM |
| Solution Developer | technical | TEAM |
| Solution Tester | technical | TEAM |
| Deployment Team | technical | TEAM |
| Project Support | support | SUPPORT |
| Business Change Team | business | PLATFORM |
| Business Change Manager | management | PROJECT |
| Project Assurance | assurance | SUPPORT |
| Project Office | support | SUPPORT |
| Stakeholder | stakeholder | SUPPORT |

## Verificación

Después de ejecutar el script, verifica que:

1. Los roles se muestren con niveles correctos en el frontend
2. No aparezcan más "(0)" en el dropdown
3. La funcionalidad de edición de usuarios funcione correctamente

## Rollback

Si necesitas revertir los cambios:

```sql
-- Revertir a niveles anteriores
UPDATE roles SET level = 'admin' WHERE id = 'role-001';
UPDATE roles SET level = 'business' WHERE id = 'role-002';
-- ... etc
```
