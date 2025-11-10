-- ============================================
-- SCRIPT SIMPLIFICADO PARA CREAR TABLAS
-- Copia y ejecuta este SQL en Supabase SQL Editor
-- ============================================

-- 1. Eliminar tablas antiguas si existen (comentar si no quieres perder datos)
DROP TABLE IF EXISTS manifiestos_residuos CASCADE;
DROP TABLE IF EXISTS manifiestos CASCADE;

-- 2. Crear tabla manifiestos
CREATE TABLE manifiestos (
    id BIGSERIAL PRIMARY KEY,
    numero_manifiesto TEXT NOT NULL UNIQUE,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    buque_id BIGINT NOT NULL REFERENCES buques(id) ON DELETE CASCADE,
    generador_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
    imagen_manifiesto_url TEXT,
    estado_digitalizacion TEXT DEFAULT 'pendiente' CHECK (estado_digitalizacion IN ('pendiente', 'en_proceso', 'completado', 'aprobado', 'rechazado')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla manifiestos_residuos
CREATE TABLE manifiestos_residuos (
    id BIGSERIAL PRIMARY KEY,
    manifiesto_id BIGINT NOT NULL UNIQUE REFERENCES manifiestos(id) ON DELETE CASCADE,
    aceite_usado NUMERIC(10, 2) DEFAULT 0 CHECK (aceite_usado >= 0),
    filtros_aceite INTEGER DEFAULT 0 CHECK (filtros_aceite >= 0),
    filtros_diesel INTEGER DEFAULT 0 CHECK (filtros_diesel >= 0),
    filtros_aire INTEGER DEFAULT 0 CHECK (filtros_aire >= 0),
    basura NUMERIC(10, 2) DEFAULT 0 CHECK (basura >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear índices
CREATE INDEX idx_manifiestos_buque ON manifiestos(buque_id);
CREATE INDEX idx_manifiestos_generador ON manifiestos(generador_id);
CREATE INDEX idx_manifiestos_numero ON manifiestos(numero_manifiesto);
CREATE INDEX idx_manifiestos_fecha ON manifiestos(fecha_emision);
CREATE INDEX idx_manifiestos_estado ON manifiestos(estado_digitalizacion);
CREATE INDEX idx_manifiestos_residuos_manifiesto ON manifiestos_residuos(manifiesto_id);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE manifiestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifiestos_residuos ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS (permitir todo por ahora)
CREATE POLICY "Enable all for manifiestos" ON manifiestos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for manifiestos_residuos" ON manifiestos_residuos FOR ALL USING (true) WITH CHECK (true);

-- 7. Verificación
SELECT 'Tablas creadas exitosamente!' as mensaje;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'manifiesto%';
