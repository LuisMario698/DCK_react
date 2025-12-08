-- 1. Permitir que buque_id sea nulo (ya que se usará texto libre)
ALTER TABLE manifiesto_basuron ALTER COLUMN buque_id DROP NOT NULL;

-- 2. Agregar campos para información manual (Desde Cero)
ALTER TABLE manifiesto_basuron ADD COLUMN IF NOT EXISTS recibimos_de TEXT;
ALTER TABLE manifiesto_basuron ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE manifiesto_basuron ADD COLUMN IF NOT EXISTS recibido_por TEXT;

-- 3. Confirmar existencia columna para archivo digitalizado
-- (Usaremos pdf_manifiesto_url que ya agregamos)

COMMENT ON COLUMN manifiesto_basuron.recibimos_de IS 'Nombre de quien entrega el residuo (Texto manual)';
COMMENT ON COLUMN manifiesto_basuron.direccion IS 'Dirección de origen del residuo (Texto manual)';
COMMENT ON COLUMN manifiesto_basuron.recibido_por IS 'Nombre de la persona que recibe el residuo (Firma/Responsable)';
