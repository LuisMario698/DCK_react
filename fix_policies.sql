-- 1. Asegurar que el bucket sea público para que funcionen los enlaces de descarga
UPDATE storage.buckets
SET public = true
WHERE id = 'manifiestos_pdf';

-- 2. Eliminar políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Ver manifiestos autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Subir manifiestos autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Actualizar propios manifiestos" ON storage.objects;
DROP POLICY IF EXISTS "Borrar propios manifiestos" ON storage.objects;

-- 3. Crear políticas permisivas para el bucket 'manifiestos_pdf'

-- PERMITIR VER (SELECT) a TODO EL MUNDO (necesario para public url)
CREATE POLICY "Public Select Manifiestos PDF"
ON storage.objects FOR SELECT
USING ( bucket_id = 'manifiestos_pdf' );

-- PERMITIR SUBIR (INSERT) a usuarios AUTENTICADOS
CREATE POLICY "Auth Insert Manifiestos PDF"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'manifiestos_pdf' );

-- PERMITIR ACTUALIZAR (UPDATE) a usuarios AUTENTICADOS
CREATE POLICY "Auth Update Manifiestos PDF"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'manifiestos_pdf' );

-- PERMITIR BORRAR (DELETE) a usuarios AUTENTICADOS
CREATE POLICY "Auth Delete Manifiestos PDF"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'manifiestos_pdf' );
