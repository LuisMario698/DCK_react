-- ============================================
-- SCRIPT PARA CREAR BUCKET Y TABLA DE MANIFIESTOS NO FIRMADOS
-- ============================================
-- Propósito: Crear infraestructura para almacenar PDFs de manifiestos
-- sin firmar y su metadata
-- ============================================

-- 1. CREAR BUCKET PARA MANIFIESTOS NO FIRMADOS
-- ============================================
-- Este bucket almacenará los PDFs generados que aún no han sido firmados

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'manifiestos-no-firmados',
  'manifiestos-no-firmados',
  false, -- No público, requiere autenticación
  10485760, -- 10MB límite por archivo
  ARRAY['application/pdf']::text[] -- Solo PDFs
);

-- Políticas de acceso para el bucket
-- Permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios pueden leer manifiestos no firmados"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'manifiestos-no-firmados');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Usuarios pueden subir manifiestos no firmados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'manifiestos-no-firmados');

-- Permitir eliminación a usuarios autenticados
CREATE POLICY "Usuarios pueden eliminar manifiestos no firmados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'manifiestos-no-firmados');


-- ============================================
-- 2. CREAR TABLA MANIFIESTOS_NO_FIRMADOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.manifiestos_no_firmados (
  -- Identificación
  id BIGSERIAL PRIMARY KEY,
  
  -- Relación con manifiesto original
  manifiesto_id BIGINT NOT NULL,
  
  -- Información del archivo PDF
  nombre_archivo TEXT NOT NULL,
  ruta_archivo TEXT NOT NULL, -- Ruta en el bucket de storage
  url_descarga TEXT, -- URL temporal de descarga
  
  -- Metadata del manifiesto
  numero_manifiesto TEXT NOT NULL,
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Estado del documento
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'descargado', 'firmado', 'cancelado')),
  
  -- Información de tracking
  descargado_en TIMESTAMP WITH TIME ZONE,
  descargado_por TEXT,
  firmado_en TIMESTAMP WITH TIME ZONE,
  
  -- Notas y observaciones
  observaciones TEXT,
  
  -- Metadata del sistema
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key al manifiesto original
  CONSTRAINT fk_manifiesto
    FOREIGN KEY (manifiesto_id)
    REFERENCES public.manifiestos(id)
    ON DELETE CASCADE
);

-- ============================================
-- 3. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índice para búsqueda por manifiesto
CREATE INDEX idx_manifiestos_no_firmados_manifiesto_id
ON public.manifiestos_no_firmados(manifiesto_id);

-- Índice para búsqueda por estado
CREATE INDEX idx_manifiestos_no_firmados_estado
ON public.manifiestos_no_firmados(estado);

-- Índice para búsqueda por fecha de generación
CREATE INDEX idx_manifiestos_no_firmados_fecha_generacion
ON public.manifiestos_no_firmados(fecha_generacion DESC);

-- Índice para búsqueda por número de manifiesto
CREATE INDEX idx_manifiestos_no_firmados_numero
ON public.manifiestos_no_firmados(numero_manifiesto);


-- ============================================
-- 4. CREAR TRIGGER PARA UPDATED_AT
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_manifiestos_no_firmados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función
CREATE TRIGGER trigger_update_manifiestos_no_firmados_updated_at
BEFORE UPDATE ON public.manifiestos_no_firmados
FOR EACH ROW
EXECUTE FUNCTION update_manifiestos_no_firmados_updated_at();


-- ============================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.manifiestos_no_firmados ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden leer
CREATE POLICY "Usuarios autenticados pueden leer manifiestos no firmados"
ON public.manifiestos_no_firmados
FOR SELECT
TO authenticated
USING (true);

-- Política: Usuarios autenticados pueden insertar
CREATE POLICY "Usuarios autenticados pueden crear manifiestos no firmados"
ON public.manifiestos_no_firmados
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Usuarios autenticados pueden actualizar
CREATE POLICY "Usuarios autenticados pueden actualizar manifiestos no firmados"
ON public.manifiestos_no_firmados
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: Usuarios autenticados pueden eliminar
CREATE POLICY "Usuarios autenticados pueden eliminar manifiestos no firmados"
ON public.manifiestos_no_firmados
FOR DELETE
TO authenticated
USING (true);


-- ============================================
-- 6. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE public.manifiestos_no_firmados IS 'Almacena metadata de PDFs de manifiestos generados pero aún no firmados';
COMMENT ON COLUMN public.manifiestos_no_firmados.id IS 'Identificador único del registro';
COMMENT ON COLUMN public.manifiestos_no_firmados.manifiesto_id IS 'Referencia al manifiesto original en la tabla manifiestos';
COMMENT ON COLUMN public.manifiestos_no_firmados.nombre_archivo IS 'Nombre del archivo PDF generado';
COMMENT ON COLUMN public.manifiestos_no_firmados.ruta_archivo IS 'Ruta del archivo en el bucket de Supabase Storage';
COMMENT ON COLUMN public.manifiestos_no_firmados.url_descarga IS 'URL temporal para descargar el PDF';
COMMENT ON COLUMN public.manifiestos_no_firmados.numero_manifiesto IS 'Número del manifiesto para referencia rápida';
COMMENT ON COLUMN public.manifiestos_no_firmados.fecha_generacion IS 'Fecha y hora en que se generó el PDF';
COMMENT ON COLUMN public.manifiestos_no_firmados.estado IS 'Estado del documento: pendiente, descargado, firmado, cancelado';
COMMENT ON COLUMN public.manifiestos_no_firmados.descargado_en IS 'Timestamp de cuándo se descargó el documento';
COMMENT ON COLUMN public.manifiestos_no_firmados.descargado_por IS 'Usuario que descargó el documento';
COMMENT ON COLUMN public.manifiestos_no_firmados.firmado_en IS 'Timestamp de cuándo se marcó como firmado';
COMMENT ON COLUMN public.manifiestos_no_firmados.observaciones IS 'Notas adicionales sobre el documento';


-- ============================================
-- 7. VERIFICACIÓN (QUERIES DE PRUEBA)
-- ============================================

-- Verificar que el bucket fue creado
SELECT * FROM storage.buckets WHERE id = 'manifiestos-no-firmados';

-- Verificar que la tabla fue creada
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'manifiestos_no_firmados';

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'manifiestos_no_firmados';

-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'manifiestos_no_firmados';


-- ============================================
-- 8. EJEMPLO DE USO
-- ============================================

/*
-- Insertar un nuevo manifiesto no firmado
INSERT INTO public.manifiestos_no_firmados (
  manifiesto_id,
  nombre_archivo,
  ruta_archivo,
  numero_manifiesto,
  estado
) VALUES (
  1, -- ID del manifiesto
  'manifiesto_001_2025.pdf',
  'manifiestos-no-firmados/2025/manifiesto_001_2025.pdf',
  'MAN-2025-001',
  'pendiente'
);

-- Actualizar cuando se descarga
UPDATE public.manifiestos_no_firmados
SET 
  estado = 'descargado',
  descargado_en = NOW(),
  descargado_por = 'usuario@example.com'
WHERE id = 1;

-- Marcar como firmado cuando se sube el documento firmado
UPDATE public.manifiestos_no_firmados
SET 
  estado = 'firmado',
  firmado_en = NOW()
WHERE id = 1;

-- Consultar manifiestos pendientes de firma
SELECT 
  mnf.*,
  m.numero_manifiesto,
  m.fecha_ingreso,
  b.nombre_buque
FROM public.manifiestos_no_firmados mnf
JOIN public.manifiestos m ON mnf.manifiesto_id = m.id
JOIN public.buques b ON m.buque_id = b.id
WHERE mnf.estado = 'pendiente'
ORDER BY mnf.fecha_generacion DESC;
*/


-- ============================================
-- SCRIPT COMPLETADO
-- ============================================
-- Para ejecutar este script:
-- 1. Conectarse a Supabase Dashboard
-- 2. Ir a SQL Editor
-- 3. Copiar y pegar este script completo
-- 4. Ejecutar
-- 
-- Nota: Si alguna parte falla, revisar los mensajes de error
-- y ajustar según sea necesario
-- ============================================
