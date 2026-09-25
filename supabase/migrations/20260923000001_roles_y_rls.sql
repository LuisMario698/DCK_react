-- ============================================================================
-- Fase 1 · E1 — Roles y seguridad
-- ----------------------------------------------------------------------------
-- * El rol del usuario vive en `profiles.rol` (ya no en la cookie
--   `simar_user_role`): 'admin' | 'recolector' | 'pendiente'.
-- * Un usuario 'recolector' queda ligado a una asociación (`asociacion_id`).
-- * Alta por invitación: el admin registra el correo en `invitaciones`; al
--   registrarse con ese correo el trigger `handle_new_user` le asigna rol y
--   asociación. Sin invitación la cuenta queda 'pendiente' y no ve datos.
-- * Todas las tablas operativas (manifiestos, buques, personas, ...) pasan a
--   ser sólo de administradores.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Perfil con rol
-- ---------------------------------------------------------------------------
alter table public.profiles
    add column if not exists rol text not null default 'pendiente',
    add column if not exists asociacion_id bigint
        references public.asociaciones_recolectoras (id) on delete set null,
    add column if not exists created_at timestamptz default now();

alter table public.profiles drop constraint if exists profiles_rol_check;
alter table public.profiles
    add constraint profiles_rol_check check (rol in ('admin', 'recolector', 'pendiente'));

create index if not exists idx_profiles_asociacion on public.profiles (asociacion_id);

-- ---------------------------------------------------------------------------
-- 2. Funciones auxiliares para las políticas RLS
--    (security definer: leen `profiles` sin pasar por su propia RLS)
-- ---------------------------------------------------------------------------
create or replace function public.get_my_role()
returns text
language sql stable security definer
set search_path = public, pg_temp
as $$
    select rol from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
    select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
$$;

create or replace function public.get_my_asociacion_id()
returns bigint
language sql stable security definer
set search_path = public, pg_temp
as $$
    select asociacion_id from public.profiles where id = auth.uid() and rol = 'recolector'
$$;

-- ---------------------------------------------------------------------------
-- 3. Invitaciones
-- ---------------------------------------------------------------------------
create table if not exists public.invitaciones (
    id            bigint generated always as identity primary key,
    email         text not null,
    rol           text not null default 'recolector' check (rol in ('admin', 'recolector')),
    asociacion_id bigint references public.asociaciones_recolectoras (id) on delete cascade,
    creada_por    uuid default auth.uid() references auth.users (id) on delete set null,
    aceptada_at   timestamptz,
    created_at    timestamptz default now(),
    constraint invitaciones_recolector_con_asociacion
        check (rol <> 'recolector' or asociacion_id is not null)
);

create unique index if not exists idx_invitaciones_email_pendiente
    on public.invitaciones (lower(email)) where aceptada_at is null;

alter table public.invitaciones enable row level security;

drop policy if exists invitaciones_admin on public.invitaciones;
create policy invitaciones_admin on public.invitaciones
    for all to authenticated
    using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Creación automática del perfil al registrarse
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    inv public.invitaciones%rowtype;
begin
    select * into inv
      from public.invitaciones
     where lower(email) = lower(new.email) and aceptada_at is null
     order by created_at desc
     limit 1;

    insert into public.profiles (id, email, full_name, avatar_url, rol, asociacion_id)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'avatar_url',
        coalesce(inv.rol, 'pendiente'),
        inv.asociacion_id
    )
    on conflict (id) do nothing;

    if inv.id is not null then
        update public.invitaciones set aceptada_at = now() where id = inv.id;
    end if;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Las cuentas que ya existían son del equipo del centro de acopio: se
-- conservan como administradores para no quitarles el acceso actual.
insert into public.profiles (id, email, full_name, rol)
select u.id, u.email, u.raw_user_meta_data ->> 'full_name', 'admin'
  from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Nadie puede cambiarse a sí mismo el rol, la asociación o el correo
-- ---------------------------------------------------------------------------
create or replace function public.proteger_campos_perfil()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    if (new.rol is distinct from old.rol
        or new.asociacion_id is distinct from old.asociacion_id
        or new.email is distinct from old.email)
       and coalesce(auth.role(), '') in ('authenticated', 'anon')
       and not public.is_admin() then
        raise exception 'No tienes permiso para cambiar el rol, la asociación o el correo del perfil';
    end if;
    if new.id is distinct from old.id then
        raise exception 'No se puede cambiar el id del perfil';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_proteger_campos_perfil on public.profiles;
create trigger trg_proteger_campos_perfil
    before update on public.profiles
    for each row execute function public.proteger_campos_perfil();

-- Políticas de profiles: cada quien ve y edita el suyo; el admin ve todos.
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;

create policy profiles_select on public.profiles
    for select to authenticated
    using (id = auth.uid() or public.is_admin());

create policy profiles_update on public.profiles
    for update to authenticated
    using (id = auth.uid() or public.is_admin())
    with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Tablas operativas: sólo administradores
-- ---------------------------------------------------------------------------
do $$
declare
    r record;
    tablas text[] := array[
        'buques', 'personas', 'tipos_persona',
        'manifiestos', 'manifiestos_residuos', 'manifiesto_basuron', 'manifiestos_no_firmados',
        'bitacora', 'audit_log', 'backups', 'backup_schedules'
    ];
    t text;
begin
    for r in
        select schemaname, tablename, policyname
          from pg_policies
         where schemaname = 'public' and tablename = any (tablas)
    loop
        execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    end loop;

    foreach t in array tablas loop
        if to_regclass('public.' || t) is not null then
            execute format('alter table public.%I enable row level security', t);
            execute format(
                'create policy admin_todo on public.%I for all to authenticated '
                'using (public.is_admin()) with check (public.is_admin())', t);
        end if;
    end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Asociaciones: admin gestiona; el recolector sólo ve la suya
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
    for r in
        select policyname from pg_policies
         where schemaname = 'public' and tablename = 'asociaciones_recolectoras'
    loop
        execute format('drop policy %I on public.asociaciones_recolectoras', r.policyname);
    end loop;
end $$;

alter table public.asociaciones_recolectoras enable row level security;

create policy asociaciones_select on public.asociaciones_recolectoras
    for select to authenticated
    using (public.is_admin() or id = public.get_my_asociacion_id());

create policy asociaciones_admin_insert on public.asociaciones_recolectoras
    for insert to authenticated with check (public.is_admin());

create policy asociaciones_admin_update on public.asociaciones_recolectoras
    for update to authenticated
    using (public.is_admin()) with check (public.is_admin());

create policy asociaciones_admin_delete on public.asociaciones_recolectoras
    for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 8. Storage de manifiestos: escritura sólo para administradores
--    (la lectura de los buckets públicos no cambia)
-- ---------------------------------------------------------------------------
drop policy if exists simar_insert_autenticados on storage.objects;
drop policy if exists simar_update_autenticados on storage.objects;
drop policy if exists simar_delete_autenticados on storage.objects;
drop policy if exists simar_lectura_no_firmados on storage.objects;

create policy simar_insert_autenticados on storage.objects
    for insert to authenticated
    with check (
        bucket_id = any (array['manifiestos_img', 'manifiestos_pdf', 'manifiestos_basuron_pdf',
                               'manifiestos-no-firmados', 'images'])
        and public.is_admin()
    );

create policy simar_update_autenticados on storage.objects
    for update to authenticated
    using (
        bucket_id = any (array['manifiestos_img', 'manifiestos_pdf', 'manifiestos_basuron_pdf',
                               'manifiestos-no-firmados', 'images'])
        and public.is_admin()
    );

create policy simar_delete_autenticados on storage.objects
    for delete to authenticated
    using (
        bucket_id = any (array['manifiestos_img', 'manifiestos_pdf', 'manifiestos_basuron_pdf',
                               'manifiestos-no-firmados', 'images'])
        and public.is_admin()
    );

create policy simar_lectura_no_firmados on storage.objects
    for select to authenticated
    using (bucket_id = 'manifiestos-no-firmados' and public.is_admin());
