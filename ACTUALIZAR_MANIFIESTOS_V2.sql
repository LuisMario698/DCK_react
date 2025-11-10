-- ============================================
-- ACTUALIZACIÓN MANIFIESTOS V2
-- ============================================
-- 1. Agregar segundo responsable
-- 2. Eliminar filtros_aire
-- ============================================

-- PASO 1: Agregar columna para segundo responsable
ALTER TABLE manifiestos 
ADD COLUMN IF NOT EXISTS responsable_secundario_id BIGINT REFERENCES personas(id) ON DELETE SET NULL;

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_manifiestos_responsable_secundario 
ON manifiestos(responsable_secundario_id);

-- PASO 2: Renombrar generador_id a responsable_principal_id para mayor claridad
ALTER TABLE manifiestos 
RENAME COLUMN generador_id TO responsable_principal_id;

-- Actualizar índice
DROP INDEX IF EXISTS idx_manifiestos_generador;
CREATE INDEX IF NOT EXISTS idx_manifiestos_responsable_principal 
ON manifiestos(responsable_principal_id);

-- PASO 3: Eliminar columna de filtros_aire de manifiestos_residuos
ALTER TABLE manifiestos_residuos 
DROP COLUMN IF EXISTS filtros_aire;

-- PASO 4: Verificar estructura de manifiestos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'manifiestos'
ORDER BY ordinal_position;

-- PASO 5: Verificar estructura de manifiestos_residuos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'manifiestos_residuos'
ORDER BY ordinal_position;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- manifiestos:
--   - responsable_principal_id (antes generador_id)
--   - responsable_secundario_id (NUEVO)
--
-- manifiestos_residuos:
--   - aceite_usado
--   - filtros_aceite
--   - filtros_diesel
--   - basura
--   (filtros_aire eliminado)
-- ============================================
