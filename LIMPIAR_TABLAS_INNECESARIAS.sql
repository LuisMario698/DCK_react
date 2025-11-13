-- ============================================
-- SCRIPT DE LIMPIEZA DE BASE DE DATOS
-- Sistema de Gestión de Residuos Marítimos
-- ============================================
-- 
-- Este script realiza dos acciones principales:
-- 1. Elimina las tablas obsoletas identificadas en el análisis
-- 2. Recrea la tabla manifiesto_basuron con la estructura correcta
--
-- ADVERTENCIA: Este script eliminará datos de forma permanente.
-- Asegúrate de hacer un respaldo antes de ejecutarlo.
-- ============================================

-- ============================================
-- PASO 1: ELIMINAR TABLAS INNECESARIAS
-- ============================================

-- Eliminar tabla reutilizacion_residuos (depende de residuos)
DROP TABLE IF EXISTS reutilizacion_residuos CASCADE;

-- Eliminar tabla cumplimiento (depende de usuarios_sistema)
DROP TABLE IF EXISTS cumplimiento CASCADE;

-- Eliminar tabla residuos (depende de tipos_residuos y buques)
DROP TABLE IF EXISTS residuos CASCADE;

-- Eliminar tabla tipos_residuos
DROP TABLE IF EXISTS tipos_residuos CASCADE;

-- Eliminar tabla usuarios_sistema
DROP TABLE IF EXISTS usuarios_sistema CASCADE;

-- ============================================
-- PASO 2: RECREAR manifiesto_basuron CON ESTRUCTURA CORRECTA
-- ============================================

-- Primero, hacer respaldo de los datos existentes (si existen)
CREATE TEMP TABLE temp_manifiesto_basuron_backup AS
SELECT 
    id,
    fecha,
    peso_entrada,
    peso_salida,
    buque_id,
    estado,
    created_at
FROM manifiesto_basuron;

-- Eliminar la tabla antigua
DROP TABLE IF EXISTS manifiesto_basuron CASCADE;

-- Crear la tabla con la estructura correcta
CREATE TABLE manifiesto_basuron (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE NOT NULL,
    peso_entrada NUMERIC(10, 2) NOT NULL CHECK (peso_entrada >= 0),
    peso_salida NUMERIC(10, 2) CHECK (peso_salida >= 0),
    total_depositado NUMERIC(10, 2) GENERATED ALWAYS AS (peso_entrada - COALESCE(peso_salida, 0)) STORED,
    buque_id BIGINT NOT NULL REFERENCES buques(id) ON DELETE CASCADE,
    responsable_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
    observaciones TEXT,
    estado TEXT DEFAULT 'En Proceso' CHECK (estado IN ('En Proceso', 'Completado', 'Cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices optimizados
CREATE INDEX idx_manifiesto_basuron_fecha ON manifiesto_basuron(fecha);
CREATE INDEX idx_manifiesto_basuron_buque ON manifiesto_basuron(buque_id);
CREATE INDEX idx_manifiesto_basuron_responsable ON manifiesto_basuron(responsable_id);
CREATE INDEX idx_manifiesto_basuron_estado ON manifiesto_basuron(estado);

-- Restaurar datos existentes (si los había)
INSERT INTO manifiesto_basuron (id, fecha, peso_entrada, peso_salida, buque_id, estado, created_at)
SELECT 
    id,
    fecha,
    peso_entrada,
    peso_salida,
    buque_id,
    estado,
    created_at
FROM temp_manifiesto_basuron_backup
ON CONFLICT (id) DO NOTHING;

-- Actualizar la secuencia para evitar conflictos de IDs
SELECT setval('manifiesto_basuron_id_seq', (SELECT COALESCE(MAX(id), 1) FROM manifiesto_basuron), true);

-- Limpiar tabla temporal
DROP TABLE IF EXISTS temp_manifiesto_basuron_backup;

-- ============================================
-- PASO 3: CREAR TRIGGER PARA updated_at
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_manifiesto_basuron_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función antes de cada UPDATE
DROP TRIGGER IF EXISTS trigger_update_manifiesto_basuron_updated_at ON manifiesto_basuron;
CREATE TRIGGER trigger_update_manifiesto_basuron_updated_at
    BEFORE UPDATE ON manifiesto_basuron
    FOR EACH ROW
    EXECUTE FUNCTION update_manifiesto_basuron_updated_at();

-- ============================================
-- PASO 4: HABILITAR RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en manifiesto_basuron
ALTER TABLE manifiesto_basuron ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajustar según tus necesidades de seguridad)
DROP POLICY IF EXISTS "Enable all for manifiesto_basuron" ON manifiesto_basuron;
CREATE POLICY "Enable all for manifiesto_basuron" 
    ON manifiesto_basuron 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que las tablas innecesarias fueron eliminadas
SELECT 
    'Tablas eliminadas correctamente' as resultado,
    COUNT(*) as tablas_restantes
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tipos_residuos', 'residuos', 'usuarios_sistema', 'cumplimiento', 'reutilizacion_residuos');

-- Verificar estructura de manifiesto_basuron
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'manifiesto_basuron'
ORDER BY ordinal_position;

-- Mostrar mensaje de éxito
SELECT '✓ Script ejecutado exitosamente. Base de datos limpia y optimizada.' as mensaje;
