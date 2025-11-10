-- ============================================
-- ACTUALIZACIÓN DE TABLA MANIFIESTOS
-- Para compatibilidad con el código TypeScript
-- ============================================

-- Primero renombra las tablas antiguas si existen
ALTER TABLE IF EXISTS manifiestos RENAME TO manifiestos_backup;
ALTER TABLE IF EXISTS manifiestos_residuos RENAME TO manifiestos_residuos_backup;

-- Crear la nueva tabla manifiestos con la estructura correcta
CREATE TABLE IF NOT EXISTS manifiestos (
    id BIGSERIAL PRIMARY KEY,
    numero_manifiesto TEXT NOT NULL UNIQUE,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Referencias
    buque_id BIGINT NOT NULL REFERENCES buques(id) ON DELETE CASCADE,
    generador_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
    
    -- Digitalización
    imagen_manifiesto_url TEXT,
    estado_digitalizacion TEXT DEFAULT 'pendiente' CHECK (estado_digitalizacion IN ('pendiente', 'en_proceso', 'completado', 'aprobado', 'rechazado')),
    
    -- Información adicional
    observaciones TEXT,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_manifiestos_buque ON manifiestos(buque_id);
CREATE INDEX IF NOT EXISTS idx_manifiestos_generador ON manifiestos(generador_id);
CREATE INDEX IF NOT EXISTS idx_manifiestos_numero ON manifiestos(numero_manifiesto);
CREATE INDEX IF NOT EXISTS idx_manifiestos_fecha ON manifiestos(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_manifiestos_estado ON manifiestos(estado_digitalizacion);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_manifiestos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_manifiestos_updated_at ON manifiestos;
CREATE TRIGGER trigger_update_manifiestos_updated_at
    BEFORE UPDATE ON manifiestos
    FOR EACH ROW
    EXECUTE FUNCTION update_manifiestos_updated_at();

-- ============================================
-- TABLA INTERMEDIA: manifiestos_residuos
-- Para registrar los residuos específicos de cada manifiesto
-- Campos específicos según formato del manifiesto físico
-- ============================================
CREATE TABLE IF NOT EXISTS manifiestos_residuos (
    id BIGSERIAL PRIMARY KEY,
    manifiesto_id BIGINT NOT NULL UNIQUE REFERENCES manifiestos(id) ON DELETE CASCADE,
    
    -- Campos específicos del manifiesto de residuos marítimos
    aceite_usado NUMERIC(10, 2) DEFAULT 0 CHECK (aceite_usado >= 0),
    filtros_aceite INTEGER DEFAULT 0 CHECK (filtros_aceite >= 0),
    filtros_diesel INTEGER DEFAULT 0 CHECK (filtros_diesel >= 0),
    filtros_aire INTEGER DEFAULT 0 CHECK (filtros_aire >= 0),
    basura NUMERIC(10, 2) DEFAULT 0 CHECK (basura >= 0),
    
    -- Unidades por defecto:
    -- aceite_usado: litros
    -- filtros_*: unidades
    -- basura: kg
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para manifiestos_residuos
CREATE INDEX IF NOT EXISTS idx_manifiestos_residuos_manifiesto ON manifiestos_residuos(manifiesto_id);

-- Trigger para actualizar updated_at automáticamente en manifiestos_residuos
CREATE OR REPLACE FUNCTION update_manifiestos_residuos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_manifiestos_residuos_updated_at ON manifiestos_residuos;
CREATE TRIGGER trigger_update_manifiestos_residuos_updated_at
    BEFORE UPDATE ON manifiestos_residuos
    FOR EACH ROW
    EXECUTE FUNCTION update_manifiestos_residuos_updated_at();

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Insertar manifiestos de ejemplo (comentar si no quieres datos de prueba)
/*
INSERT INTO manifiestos (
    numero_manifiesto, 
    fecha_emision, 
    buque_id, 
    generador_id, 
    estado_digitalizacion,
    observaciones
) VALUES
    ('MAN-2025-001', '2025-01-15', 1, 1, 'completado', 'Primer manifiesto de prueba'),
    ('MAN-2025-002', '2025-01-16', 2, 2, 'pendiente', 'Segundo manifiesto de prueba'),
    ('MAN-2025-003', '2025-01-17', 1, 3, 'en_proceso', 'Tercer manifiesto de prueba')
ON CONFLICT (numero_manifiesto) DO NOTHING;

-- Insertar residuos asociados a manifiestos de ejemplo
INSERT INTO manifiestos_residuos (
    manifiesto_id, 
    tipo_residuo_id, 
    cantidad, 
    unidad
) VALUES
    (1, 1, 50.5, 'kg'),
    (1, 3, 30.0, 'kg'),
    (2, 2, 100.0, 'kg'),
    (2, 4, 25.5, 'kg'),
    (3, 5, 15.0, 'kg')
ON CONFLICT (manifiesto_id, tipo_residuo_id) DO NOTHING;
*/

-- ============================================
-- VERIFICACIÓN DE ESTRUCTURA
-- ============================================

-- Consulta para verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'manifiestos'
ORDER BY ordinal_position;

-- Consulta para verificar índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'manifiestos';

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en manifiestos
ALTER TABLE manifiestos ENABLE ROW LEVEL SECURITY;

-- Permitir a todos leer manifiestos
CREATE POLICY "Enable read access for all users" ON manifiestos
    FOR SELECT USING (true);

-- Permitir a todos insertar manifiestos
CREATE POLICY "Enable insert for all users" ON manifiestos
    FOR INSERT WITH CHECK (true);

-- Permitir a todos actualizar manifiestos
CREATE POLICY "Enable update for all users" ON manifiestos
    FOR UPDATE USING (true);

-- Permitir a todos eliminar manifiestos
CREATE POLICY "Enable delete for all users" ON manifiestos
    FOR DELETE USING (true);

-- Habilitar RLS en manifiestos_residuos
ALTER TABLE manifiestos_residuos ENABLE ROW LEVEL SECURITY;

-- Permitir a todos leer manifiestos_residuos
CREATE POLICY "Enable read access for all users" ON manifiestos_residuos
    FOR SELECT USING (true);

-- Permitir a todos insertar manifiestos_residuos
CREATE POLICY "Enable insert for all users" ON manifiestos_residuos
    FOR INSERT WITH CHECK (true);

-- Permitir a todos actualizar manifiestos_residuos
CREATE POLICY "Enable update for all users" ON manifiestos_residuos
    FOR UPDATE USING (true);

-- Permitir a todos eliminar manifiestos_residuos
CREATE POLICY "Enable delete for all users" ON manifiestos_residuos
    FOR DELETE USING (true);

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. La tabla manifiestos_backup contiene tu estructura anterior
-- 2. Si necesitas migrar datos, crea un script específico de migración
-- 3. La nueva tabla soporta residuos específicos mediante manifiestos_residuos:
--    - aceite_usado (litros)
--    - filtros_aceite (unidades)
--    - filtros_diesel (unidades)
--    - filtros_aire (unidades)
--    - basura (kg)
-- 4. Los estados de digitalización son: 'pendiente', 'en_proceso', 'completado', 'aprobado', 'rechazado'
-- 5. Relación 1-a-1 entre manifiestos y manifiestos_residuos (via UNIQUE constraint)
