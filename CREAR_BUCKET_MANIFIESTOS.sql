-- ============================================
-- CREAR BUCKET PARA IMÁGENES DE MANIFIESTOS
-- ============================================

-- Crear el bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('manifiestos_img', 'manifiestos_img', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'manifiestos_img');

-- Política para permitir subida
CREATE POLICY "Allow upload manifiestos_img"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'manifiestos_img');

-- Política para permitir actualización
CREATE POLICY "Allow update manifiestos_img"
ON storage.objects FOR UPDATE
USING (bucket_id = 'manifiestos_img');

-- Política para permitir eliminación
CREATE POLICY "Allow delete manifiestos_img"
ON storage.objects FOR DELETE
USING (bucket_id = 'manifiestos_img');
