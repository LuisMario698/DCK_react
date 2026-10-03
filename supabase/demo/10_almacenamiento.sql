-- ============================================================================
-- Demo · Almacenamiento
-- ----------------------------------------------------------------------------
-- Los buckets que la app lee. En la demo nadie sube archivos (ver
-- 30_candado.sql): los PDF del manifiesto y del basurón se generan en el
-- navegador al descargarlos. Sólo hace falta subir a mano el logo de SEMARNAT
-- a `images/logoSemarnat.png` (lo usan los PDF; ver supabase/demo/README.md).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('manifiestos_img', 'manifiestos_img', true),
       ('manifiestos_pdf', 'manifiestos_pdf', true),
       ('manifiestos_basuron_pdf', 'manifiestos_basuron_pdf', true),
       ('manifiestos-no-firmados', 'manifiestos-no-firmados', false),
       ('images', 'images', true)
on conflict (id) do update set public = excluded.public;

-- Lectura de los buckets públicos para cualquiera (las URL públicas ya lo
-- permiten; esto cubre también las descargas con el cliente de Supabase).
drop policy if exists demo_lectura_publica on storage.objects;
create policy demo_lectura_publica on storage.objects
    for select to anon, authenticated
    using (bucket_id = any (array['manifiestos_img', 'manifiestos_pdf', 'manifiestos_basuron_pdf', 'images']));
