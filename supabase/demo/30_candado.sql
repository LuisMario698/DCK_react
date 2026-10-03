-- ============================================================================
-- Demo · Candado: la demo es de sólo lectura
-- ----------------------------------------------------------------------------
-- Cualquier escritura que llegue por la app (rol anon o authenticated, también
-- dentro de las RPC) se rechaza con un aviso amable. El editor SQL (postgres),
-- la creación de cuentas desde el panel de Supabase y pg_cron no llevan JWT,
-- así que sí pueden sembrar y poner al día los datos.
--
-- La app, en modo demostración, ya ataja las escrituras antes de mandarlas
-- (lib/demo/supabaseDemo.ts); esto es la segunda llave, por si alguien llama a
-- la API a mano con la cuenta de la demo.
--
-- Si después se agrega una tabla, vuelve a correr este archivo.
-- ============================================================================

-- Seguro: sólo corre en la base de la demostración (nunca en producción, donde borraría datos reales)
do $$
begin
    if to_regprocedure('public.es_base_demo()') is null and to_regprocedure('public.demo_poner_al_dia()') is null then
        raise exception 'Esta no es la base de la demostración. Este archivo sólo va en el proyecto Supabase de la demo (ver supabase/demo/README.md).';
    end if;
end $$;

-- RLS en todas las tablas. El volcado y las migraciones dejan `profiles` con sus políticas pero sin
-- encender RLS (en producción está encendido): sin esto, cualquier sesión leería todos los perfiles.
do $$
declare t record;
begin
    for t in
        select c.relname
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
    loop
        execute format('alter table public.%I enable row level security', t.relname);
    end loop;
end $$;

create or replace function public.demo_solo_lectura()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    if coalesce(auth.role(), '') in ('authenticated', 'anon') then
        raise exception 'En la demostración no se guardan cambios'
            using hint = 'modo_demo';
    end if;
    return null;
end;
$$;

do $$
declare t record;
begin
    for t in
        select c.relname
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind in ('r', 'p')
    loop
        execute format('drop trigger if exists zz_demo_solo_lectura on public.%I', t.relname);
        execute format(
            'create trigger zz_demo_solo_lectura before insert or update or delete or truncate on public.%I '
            'for each statement execute function public.demo_solo_lectura()', t.relname);
    end loop;
end $$;

-- Archivos: nadie sube, cambia ni borra (las políticas restrictivas se suman a las demás con "y")
drop policy if exists demo_sin_subir on storage.objects;
create policy demo_sin_subir on storage.objects as restrictive
    for insert to anon, authenticated with check (false);

drop policy if exists demo_sin_cambiar on storage.objects;
create policy demo_sin_cambiar on storage.objects as restrictive
    for update to anon, authenticated using (false);

drop policy if exists demo_sin_borrar on storage.objects;
create policy demo_sin_borrar on storage.objects as restrictive
    for delete to anon, authenticated using (false);
