-- Crear el bucket 'manifiestos_pdf'
-- Nota: 'public' en false para que sea privado (requiere autenticación/firmas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'manifiestos_pdf', 
  'manifiestos_pdf', 
  false, 
  5242880, -- 5MB límite (opcional, ajustable)
  ARRAY['application/pdf'] -- Solo PDFs
);

-- Habilitar RLS ( Row Level Security) es automático en storage.objects, pero necesitamos políticas.

-- POLÍTICAS DE ACCESO (Ajustar según necesidad, aquí ejemplo para usuarios autenticados)

-- 1. Permitir ver archivos (SELECT) a usuarios autenticados
CREATE POLICY "Ver manifiestos autenticados"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'manifiestos_pdf' );

-- 2. Permitir subir archivos (INSERT) a usuarios autenticados
CREATE POLICY "Subir manifiestos autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'manifiestos_pdf' );

-- 3. Permitir actualizar sus propios archivos (UPDATE) - Opcional
CREATE POLICY "Actualizar propios manifiestos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'manifiestos_pdf' AND owner = auth.uid() );

-- 4. Permitir borrar sus propios archivos (DELETE) - Opcional
CREATE POLICY "Borrar propios manifiestos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'manifiestos_pdf' AND owner = auth.uid() );
