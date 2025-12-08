-- 1. Asegurar que el bucket exista y sea público
INSERT INTO storage.buckets (id, name, public)
VALUES ('manifiestos_basuron_pdf', 'manifiestos_basuron_pdf', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Eliminar políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Public Select Basuron PDF" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Basuron PDF" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Basuron PDF" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Basuron PDF" ON storage.objects;

-- 3. Crear políticas para el bucket 'manifiestos_basuron_pdf'

-- PERMITIR VER (SELECT) a TODO EL MUNDO (necesario para public url)
CREATE POLICY "Public Select Basuron PDF"
ON storage.objects FOR SELECT
USING ( bucket_id = 'manifiestos_basuron_pdf' );

-- PERMITIR SUBIR (INSERT) a usuarios AUTENTICADOS
CREATE POLICY "Auth Insert Basuron PDF"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'manifiestos_basuron_pdf' );

-- PERMITIR ACTUALIZAR (UPDATE) a usuarios AUTENTICADOS
CREATE POLICY "Auth Update Basuron PDF"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'manifiestos_basuron_pdf' );

-- PERMITIR BORRAR (DELETE) a usuarios AUTENTICADOS
CREATE POLICY "Auth Delete Basuron PDF"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'manifiestos_basuron_pdf' );

-- 4. debug: Verificar políticas (opcional)
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
