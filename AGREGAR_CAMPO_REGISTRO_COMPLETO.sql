-- =====================================================
-- MIGRACIÓN: Agregar campo registro_completo
-- =====================================================
-- Este script agrega un campo 'registro_completo' a las tablas
-- buques y personas para marcar registros que fueron creados
-- automáticamente desde el formulario de manifiestos.
-- =====================================================

-- Agregar campo a tabla buques
ALTER TABLE buques 
ADD COLUMN IF NOT EXISTS registro_completo BOOLEAN DEFAULT true;

-- Agregar campo a tabla personas
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS registro_completo BOOLEAN DEFAULT true;

-- Comentarios descriptivos
COMMENT ON COLUMN buques.registro_completo IS 'Indica si el registro tiene todos los datos completos. FALSE = creado automáticamente desde manifiesto';
COMMENT ON COLUMN personas.registro_completo IS 'Indica si el registro tiene todos los datos completos. FALSE = creado automáticamente desde manifiesto';

-- Actualizar registros existentes como completos
UPDATE buques SET registro_completo = true WHERE registro_completo IS NULL;
UPDATE personas SET registro_completo = true WHERE registro_completo IS NULL;
