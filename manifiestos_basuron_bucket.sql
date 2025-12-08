-- 1. Crear el bucket 'manifiestos_basuron_pdf' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('manifiestos_basuron_pdf', 'manifiestos_basuron_pdf', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas anteriores para evitar conflictos (limpieza)
DROP POLICY IF EXISTS "Ver manifiestos basuron publico" ON storage.objects;
DROP POLICY IF EXISTS "Subir manifiestos basuron autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Actualizar manifiestos basuron autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Borrar manifiestos basuron autenticado" ON storage.objects;

-- 3. Crear políticas RLS para el bucket 'manifiestos_basuron_pdf'

-- PERMITIR VER (SELECT) a TODO EL MUNDO (necesario para public url y descarga)
CREATE POLICY "Ver manifiestos basuron publico"
ON storage.objects FOR SELECT
USING ( bucket_id = 'manifiestos_basuron_pdf' );

-- PERMITIR SUBIR (INSERT) a usuarios AUTENTICADOS
CREATE POLICY "Subir manifiestos basuron autenticado"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'manifiestos_basuron_pdf' );

-- PERMITIR ACTUALIZAR (UPDATE) a usuarios AUTENTICADOS
CREATE POLICY "Actualizar manifiestos basuron autenticado"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'manifiestos_basuron_pdf' );

-- PERMITIR BORRAR (DELETE) a usuarios AUTENTICADOS
CREATE POLICY "Borrar manifiestos basuron autenticado"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'manifiestos_basuron_pdf' );
