-- Política DEPURACION (Permisiva)
-- CUIDADO: Permite subir a cualquiera, solo para probar si es problema de autenticación

-- Asegurar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('manifiestos_basuron_pdf', 'manifiestos_basuron_pdf', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Borrar politicas previas restrictivas de este bucket
DROP POLICY IF EXISTS "Public Select Basuron PDF" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Basuron PDF" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Basuron PDF" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Basuron PDF" ON storage.objects;

-- Crear políticas totalmente públicas para el bucket específico

CREATE POLICY "DEBUG Public Insert Basuron PDF"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'manifiestos_basuron_pdf' );

CREATE POLICY "DEBUG Public Select Basuron PDF"
ON storage.objects FOR SELECT
USING ( bucket_id = 'manifiestos_basuron_pdf' );

CREATE POLICY "DEBUG Public Update Basuron PDF"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'manifiestos_basuron_pdf' );

CREATE POLICY "DEBUG Public Delete Basuron PDF"
ON storage.objects FOR DELETE
USING ( bucket_id = 'manifiestos_basuron_pdf' );
