-- Agregar columna para almacenar la URL del PDF generado
ALTER TABLE manifiestos
ADD COLUMN pdf_manifiesto_url TEXT;

-- Opcional: Agregar comentario descriptivo
COMMENT ON COLUMN manifiestos.pdf_manifiesto_url IS 'URL del archivo PDF generado y almacenado en el bucket manifiestos_pdf';
