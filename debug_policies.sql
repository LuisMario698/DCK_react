-- SOLUCIÓN "TOTAL" PARA DEBUG: PERMISOS TOTALES
-- Esto eliminará cualquier restricción para asegurar que el archivo suba.

-- 1. Asegurar que el bucket exista y sea público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('manifiestos_pdf', 'manifiestos_pdf', true, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpiar TODAS las políticas previas relacionadas con este bucket (por si acaso)
DROP POLICY IF EXISTS "Ver manifiestos autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Subir manifiestos autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Actualizar propios manifiestos" ON storage.objects;
DROP POLICY IF EXISTS "Borrar propios manifiestos" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Manifiestos PDF" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Manifiestos PDF" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Manifiestos PDF" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Manifiestos PDF" ON storage.objects;
DROP POLICY IF EXISTS "Super Permissive Manifiestos PDF" ON storage.objects;

-- 3. Crear una política MAESTRA que permite TODO a TODO EL MUNDO (Public)
-- Esto descarta problemas de autenticación o roles.
CREATE POLICY "Super Permissive Manifiestos PDF"
ON storage.objects FOR ALL
TO public
USING ( bucket_id = 'manifiestos_pdf' )
WITH CHECK ( bucket_id = 'manifiestos_pdf' );
