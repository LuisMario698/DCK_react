-- Agregar columna pdf_manifiesto_url a la tabla manifiesto_basuron
ALTER TABLE manifiesto_basuron
ADD COLUMN IF NOT EXISTS pdf_manifiesto_url TEXT;

-- Comentario para documentación
COMMENT ON COLUMN manifiesto_basuron.pdf_manifiesto_url IS 'URL del archivo PDF generado y almacenado en Storage';
