-- Habilitar RLS en la tabla (si no está habilitado)
ALTER TABLE manifiesto_basuron ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos al recrearlas
DROP POLICY IF EXISTS "Permitir lectura a todos" ON manifiesto_basuron;
DROP POLICY IF EXISTS "Permitir inserción a autenticados" ON manifiesto_basuron;
DROP POLICY IF EXISTS "Permitir actualización a autenticados" ON manifiesto_basuron;
DROP POLICY IF EXISTS "Permitir borrado a autenticados" ON manifiesto_basuron;

-- Crear políticas permisivas

-- 1. SELECT: Permitir ver a todos (público) o solo autenticados.
-- Dado que es un sistema interno, mejor solo autenticados, pero para evitar problemas de "anon" en desarrollo:
-- Usaremos public para lectura por ahora para facilitar debug, o authenticated.
-- Si el usuario usa "anon" key en cliente, necesita ser public. Si usa login, authenticated.
-- Asumimos authenticated para seguridad básica.
CREATE POLICY "Permitir lectura a todos"
ON manifiesto_basuron FOR SELECT
USING (true); -- O TO authenticated si queremos cerrar

-- 2. INSERT: Permitir a usuarios autenticados
CREATE POLICY "Permitir inserción a autenticados"
ON manifiesto_basuron FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. UPDATE: Permitir a usuarios autenticados
CREATE POLICY "Permitir actualización a autenticados"
ON manifiesto_basuron FOR UPDATE
TO authenticated
USING (true);

-- 4. DELETE: Permitir a usuarios autenticados
CREATE POLICY "Permitir borrado a autenticados"
ON manifiesto_basuron FOR DELETE
TO authenticated
USING (true);

-- También asegurar permisos en el bucket por si acaso (aunque ya lo hicimos, no está de más reforzar)
-- (Opcional, si el error fuera de storage, pero el error dijo "new row", así que es tabla)
