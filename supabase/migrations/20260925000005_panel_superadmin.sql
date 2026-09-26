-- ============================================================================
-- Panel de superadministrador (desarrollador) — /[locale]/superadmin
-- ----------------------------------------------------------------------------
-- * `profiles.es_superadmin`: bandera que sólo otorga otro superadmin (o el
--   SQL Editor). Un superadmin siempre es también 'admin'.
-- * Suspensión de cuentas: `profiles.suspendido_at` corta el acceso a los
--   datos (las funciones auxiliares de RLS dejan de reconocer el rol) y
--   `auth.users.banned_until` impide volver a iniciar sesión.
-- * Suscripciones de las asociaciones recolectoras: catálogo de planes, una
--   suscripción por asociación y pagos registrados a mano (no hay pasarela).
--   Todos los importes son en MXN.
-- * Configuración global: modo mantenimiento, aviso global, suscripciones
--   obligatorias y días de prueba.
-- * `audit_log` registra también el correo de quien hizo el cambio.
--
-- Primer superadmin (en el SQL Editor, una sola vez):
--   update public.profiles set rol = 'admin', es_superadmin = true
--    where email = '<correo del desarrollador>';
--
-- Idempotente: se puede volver a ejecutar.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Perfil: superadmin y suspensión
-- ---------------------------------------------------------------------------
alter table public.profiles
    add column if not exists es_superadmin boolean not null default false,
    add column if not exists suspendido_at timestamptz,
    add column if not exists motivo_suspension text;

alter table public.profiles drop constraint if exists profiles_superadmin_es_admin;
alter table public.profiles
    add constraint profiles_superadmin_es_admin check (not es_superadmin or rol = 'admin');

-- ---------------------------------------------------------------------------
-- 2. Funciones auxiliares de RLS: una cuenta suspendida pierde su rol
-- ---------------------------------------------------------------------------
create or replace function public.get_my_role()
returns text
language sql stable security definer
set search_path = public, pg_temp
as $$
    select case when suspendido_at is null then rol else 'suspendido' end
      from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1 from public.profiles
         where id = auth.uid() and rol = 'admin' and suspendido_at is null
    )
$$;

create or replace function public.get_my_asociacion_id()
returns bigint
language sql stable security definer
set search_path = public, pg_temp
as $$
    select asociacion_id from public.profiles
     where id = auth.uid() and rol = 'recolector' and suspendido_at is null
$$;

create or replace function public.is_superadmin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1 from public.profiles
         where id = auth.uid() and es_superadmin and suspendido_at is null
    )
$$;

-- ---------------------------------------------------------------------------
-- 3. Protección del perfil
--    · Nadie se cambia a sí mismo rol, asociación ni correo (como antes).
--    · Superadmin y suspensión sólo los cambia un superadmin.
--    · La cuenta de un superadmin sólo la modifica otro superadmin.
--    Las comprobaciones aplican a peticiones de la API; el SQL Editor y el
--    service_role no tienen `auth.role()` de usuario y quedan fuera.
-- ---------------------------------------------------------------------------
create or replace function public.proteger_campos_perfil()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
    v_desde_api boolean := coalesce(auth.role(), '') in ('authenticated', 'anon');
    v_cambia_acceso boolean := new.rol is distinct from old.rol
                               or new.asociacion_id is distinct from old.asociacion_id
                               or new.email is distinct from old.email;
begin
    if new.id is distinct from old.id then
        raise exception 'No se puede cambiar el id del perfil';
    end if;
    if not v_desde_api then
        return new;
    end if;

    if (new.es_superadmin is distinct from old.es_superadmin
        or new.suspendido_at is distinct from old.suspendido_at
        or new.motivo_suspension is distinct from old.motivo_suspension)
       and not public.is_superadmin() then
        raise exception 'Sólo un superadministrador puede cambiar estos datos del perfil';
    end if;

    if old.es_superadmin and v_cambia_acceso and not public.is_superadmin() then
        raise exception 'Sólo un superadministrador puede modificar la cuenta de otro superadministrador';
    end if;

    if v_cambia_acceso and not public.is_admin() then
        raise exception 'No tienes permiso para cambiar el rol, la asociación o el correo del perfil';
    end if;

    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Bitácora con el correo de quien hizo el cambio
-- ---------------------------------------------------------------------------
create or replace function public.audit_trigger_fn()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
    insert into audit_log (tabla, operacion, registro_id, datos_ant, datos_nue, usuario_email)
    values (
        tg_table_name,
        tg_op,
        case when tg_op = 'DELETE' then old.id::text else new.id::text end,
        case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
        case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
        nullif(auth.jwt() ->> 'email', '')
    );
    if tg_op = 'DELETE' then return old; end if;
    return new;
end;
$$;

-- Cambios de rol, suspensiones y bajas de cuentas quedan en la bitácora
drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles after update or delete on public.profiles
    for each row execute function public.audit_trigger_fn();

create index if not exists idx_audit_log_created on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Configuración global del sistema (claves fijas, sólo se editan)
-- ---------------------------------------------------------------------------
create table if not exists public.configuracion_sistema (
    id          bigint generated always as identity primary key,
    clave       text not null unique,
    valor       jsonb not null,
    descripcion text,
    updated_at  timestamptz default now(),
    updated_by  uuid references auth.users (id) on delete set null
);

insert into public.configuracion_sistema (clave, valor, descripcion) values
    ('mantenimiento', '{"activo": false, "mensaje": ""}',
     'Cierra los paneles a todos excepto a los superadministradores'),
    ('aviso_global', '{"activo": false, "mensaje": "", "tipo": "info"}',
     'Banner visible en los paneles de administrador y recolector'),
    ('suscripciones', '{"obligatorias": false, "dias_prueba": 30}',
     'Si son obligatorias, una asociación sin suscripción vigente no puede crear solicitudes')
on conflict (clave) do nothing;

create or replace function public.configuracion_set_updated()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.updated_at := now();
    new.updated_by := coalesce(auth.uid(), new.updated_by);
    return new;
end;
$$;

drop trigger if exists trg_configuracion_updated on public.configuracion_sistema;
create trigger trg_configuracion_updated before update on public.configuracion_sistema
    for each row execute function public.configuracion_set_updated();

drop trigger if exists trg_audit_configuracion on public.configuracion_sistema;
create trigger trg_audit_configuracion after update on public.configuracion_sistema
    for each row execute function public.audit_trigger_fn();

alter table public.configuracion_sistema enable row level security;

drop policy if exists configuracion_select on public.configuracion_sistema;
create policy configuracion_select on public.configuracion_sistema
    for select to authenticated using ((select public.is_superadmin()));

drop policy if exists configuracion_update on public.configuracion_sistema;
create policy configuracion_update on public.configuracion_sistema
    for update to authenticated
    using ((select public.is_superadmin())) with check ((select public.is_superadmin()));

-- ---------------------------------------------------------------------------
-- 6. Planes, suscripciones y pagos
-- ---------------------------------------------------------------------------
create table if not exists public.planes (
    id              bigint generated always as identity primary key,
    nombre          text not null unique check (char_length(btrim(nombre)) between 1 and 80),
    descripcion     text,
    precio_mensual  numeric(12, 2) not null default 0 check (precio_mensual >= 0),
    precio_anual    numeric(12, 2) check (precio_anual >= 0),
    limite_usuarios integer check (limite_usuarios > 0),
    caracteristicas text[] not null default '{}',
    activo          boolean not null default true,
    orden           integer not null default 0,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- Una suscripción (la vigente) por asociación. 'vencida' no se guarda: se
-- deriva de `vence_el` con estado_efectivo_suscripcion().
create table if not exists public.suscripciones (
    id            bigint generated always as identity primary key,
    asociacion_id bigint not null unique references public.asociaciones_recolectoras (id) on delete cascade,
    plan_id       bigint not null references public.planes (id) on delete restrict,
    estado        text not null default 'prueba'
                  check (estado in ('prueba', 'activa', 'suspendida', 'cancelada')),
    ciclo         text not null default 'mensual' check (ciclo in ('mensual', 'anual')),
    precio        numeric(12, 2) not null default 0 check (precio >= 0),
    fecha_inicio  date not null default public.hoy_local(),
    vence_el      date,
    notas         text,
    created_at    timestamptz default now(),
    updated_at    timestamptz default now(),
    constraint suscripciones_vigencia check (vence_el is null or vence_el >= fecha_inicio)
);

create index if not exists idx_suscripciones_plan on public.suscripciones (plan_id);

create table if not exists public.pagos_suscripcion (
    id             bigint generated always as identity primary key,
    suscripcion_id bigint not null references public.suscripciones (id) on delete cascade,
    monto          numeric(12, 2) not null check (monto > 0),
    fecha_pago     date not null default public.hoy_local(),
    metodo         text not null default 'transferencia'
                   check (metodo in ('transferencia', 'deposito', 'efectivo', 'tarjeta', 'otro')),
    referencia     text,
    cubre_hasta    date,
    notas          text,
    registrado_por uuid default auth.uid() references auth.users (id) on delete set null,
    created_at     timestamptz default now()
);

create index if not exists idx_pagos_suscripcion on public.pagos_suscripcion (suscripcion_id, fecha_pago desc);
create index if not exists idx_pagos_fecha on public.pagos_suscripcion (fecha_pago);

drop trigger if exists trg_planes_updated_at on public.planes;
create trigger trg_planes_updated_at before update on public.planes
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_suscripciones_updated_at on public.suscripciones;
create trigger trg_suscripciones_updated_at before update on public.suscripciones
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_audit_planes on public.planes;
create trigger trg_audit_planes after insert or update or delete on public.planes
    for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_suscripciones on public.suscripciones;
create trigger trg_audit_suscripciones after insert or update or delete on public.suscripciones
    for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_pagos on public.pagos_suscripcion;
create trigger trg_audit_pagos after insert or update or delete on public.pagos_suscripcion
    for each row execute function public.audit_trigger_fn();

create or replace function public.estado_efectivo_suscripcion(p_estado text, p_vence_el date)
returns text
language sql stable
set search_path = public, pg_temp
as $$
    select case
        when p_estado in ('prueba', 'activa') and p_vence_el is not null and p_vence_el < public.hoy_local()
            then 'vencida'
        else p_estado
    end
$$;

-- RLS: el superadmin gestiona todo; la asociación sólo lee lo suyo
alter table public.planes            enable row level security;
alter table public.suscripciones     enable row level security;
alter table public.pagos_suscripcion enable row level security;

drop policy if exists planes_select on public.planes;
create policy planes_select on public.planes
    for select to authenticated
    using (
        (select public.is_admin())
        or id in (select s.plan_id from public.suscripciones s
                   where s.asociacion_id = (select public.get_my_asociacion_id()))
    );

drop policy if exists planes_superadmin on public.planes;
create policy planes_superadmin on public.planes
    for all to authenticated
    using ((select public.is_superadmin())) with check ((select public.is_superadmin()));

drop policy if exists suscripciones_select on public.suscripciones;
create policy suscripciones_select on public.suscripciones
    for select to authenticated
    using (
        (select public.is_superadmin())
        or asociacion_id = (select public.get_my_asociacion_id())
    );

drop policy if exists suscripciones_superadmin on public.suscripciones;
create policy suscripciones_superadmin on public.suscripciones
    for all to authenticated
    using ((select public.is_superadmin())) with check ((select public.is_superadmin()));

drop policy if exists pagos_select on public.pagos_suscripcion;
create policy pagos_select on public.pagos_suscripcion
    for select to authenticated
    using (
        (select public.is_superadmin())
        or suscripcion_id in (select s.id from public.suscripciones s
                               where s.asociacion_id = (select public.get_my_asociacion_id()))
    );

drop policy if exists pagos_superadmin on public.pagos_suscripcion;
create policy pagos_superadmin on public.pagos_suscripcion
    for all to authenticated
    using ((select public.is_superadmin())) with check ((select public.is_superadmin()));

-- ¿La asociación puede operar? Si las suscripciones no son obligatorias,
-- siempre; si lo son, necesita una suscripción en prueba o activa sin vencer.
create or replace function public.suscripcion_vigente(p_asociacion_id bigint)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
    select not coalesce((select (valor ->> 'obligatorias')::boolean
                           from public.configuracion_sistema where clave = 'suscripciones'), false)
        or exists (
            select 1 from public.suscripciones s
             where s.asociacion_id = p_asociacion_id
               and public.estado_efectivo_suscripcion(s.estado, s.vence_el) in ('prueba', 'activa')
        )
$$;

-- Estado de la suscripción de la asociación del usuario (portal recolector).
-- `null` si el usuario no es recolector.
create or replace function public.estado_mi_suscripcion()
returns jsonb
language sql stable security definer
set search_path = public, pg_temp
as $$
    select jsonb_build_object(
        'obligatoria', coalesce((select (valor ->> 'obligatorias')::boolean
                                   from public.configuracion_sistema where clave = 'suscripciones'), false),
        'vigente',     public.suscripcion_vigente(a.id),
        'estado',      public.estado_efectivo_suscripcion(s.estado, s.vence_el),
        'vence_el',    s.vence_el,
        'plan',        p.nombre
    )
    from (select public.get_my_asociacion_id() as id) a
    left join public.suscripciones s on s.asociacion_id = a.id
    left join public.planes p on p.id = s.plan_id
    where a.id is not null
$$;

-- ---------------------------------------------------------------------------
-- 7. Acceso: lo que el middleware necesita saber en una sola llamada
-- ---------------------------------------------------------------------------
create or replace function public.mi_acceso()
returns jsonb
language sql stable security definer
set search_path = public, pg_temp
as $$
    select jsonb_build_object(
        'rol',           coalesce(p.rol, 'pendiente'),
        'es_superadmin', coalesce(p.es_superadmin, false),
        'suspendida',    p.suspendido_at is not null,
        'mantenimiento', coalesce((select (valor ->> 'activo')::boolean
                                     from public.configuracion_sistema where clave = 'mantenimiento'), false)
    )
    from (select auth.uid() as uid) s
    left join public.profiles p on p.id = s.uid
$$;

-- Aviso global y mantenimiento para cualquier usuario con sesión
create or replace function public.configuracion_publica()
returns jsonb
language sql stable security definer
set search_path = public, pg_temp
as $$
    select jsonb_build_object(
        'mantenimiento', coalesce((select valor from public.configuracion_sistema where clave = 'mantenimiento'),
                                  '{"activo": false}'::jsonb),
        'aviso_global',  coalesce((select valor from public.configuracion_sistema where clave = 'aviso_global'),
                                  '{"activo": false}'::jsonb)
    )
$$;

-- ---------------------------------------------------------------------------
-- 8. Flujo existente: suscripción vigente y límite de usuarios del plan
-- ---------------------------------------------------------------------------
create or replace function public.crear_solicitud(
    p_tipo text,
    p_cantidad numeric,
    p_fecha_propuesta date,
    p_mensaje text default null
)
returns public.solicitudes_recoleccion
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_asociacion bigint := public.get_my_asociacion_id();
    v_estado     text;
    v_inv        public.inventario_residuos%rowtype;
    v_sol        public.solicitudes_recoleccion;
begin
    if v_asociacion is null then
        raise exception 'Tu usuario no está vinculado a una asociación recolectora';
    end if;

    select estado into v_estado from public.asociaciones_recolectoras where id = v_asociacion;
    if v_estado <> 'Activo' then
        raise exception 'Tu asociación está %: no puede crear solicitudes', lower(v_estado);
    end if;

    if not public.suscripcion_vigente(v_asociacion) then
        raise exception 'La suscripción de tu asociación no está vigente: no puede crear solicitudes';
    end if;

    if p_cantidad is null or p_cantidad <= 0 then
        raise exception 'La cantidad debe ser mayor que cero';
    end if;
    if p_fecha_propuesta is null or p_fecha_propuesta < public.hoy_local() then
        raise exception 'La fecha propuesta no puede ser anterior a hoy';
    end if;

    select * into v_inv from public.inventario_residuos where tipo = p_tipo and publicado;
    if not found then
        raise exception 'Ese residuo no está disponible en el inventario';
    end if;
    if p_cantidad > v_inv.cantidad then
        raise exception 'Sólo hay % % disponibles', v_inv.cantidad, v_inv.unidad;
    end if;

    insert into public.solicitudes_recoleccion
        (asociacion_id, tipo, cantidad_solicitada, unidad, fecha_propuesta, mensaje)
    values
        (v_asociacion, p_tipo, p_cantidad, v_inv.unidad, p_fecha_propuesta, nullif(btrim(p_mensaje), ''))
    returning * into v_sol;

    return v_sol;
end;
$$;

create or replace function public.invitar_usuario(
    p_email text,
    p_rol text default 'recolector',
    p_asociacion_id bigint default null
)
returns text
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_email  text := lower(btrim(p_email));
    v_perfil uuid;
    v_limite integer;
    v_usados bigint;
begin
    if not public.is_admin() then
        raise exception 'Sólo un administrador puede invitar usuarios';
    end if;
    if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
        raise exception 'Correo electrónico no válido';
    end if;
    if p_rol not in ('admin', 'recolector') then
        raise exception 'Rol no válido';
    end if;
    if p_rol = 'recolector' and p_asociacion_id is null then
        raise exception 'Un usuario recolector debe estar ligado a una asociación';
    end if;

    -- Se busca en auth.users (correo verificado por Supabase), no en
    -- profiles.email, para que nadie pueda "apropiarse" de una invitación.
    select id into v_perfil from auth.users where lower(email) = v_email;

    -- Límite de usuarios del plan contratado (si la asociación tiene uno)
    if p_rol = 'recolector' then
        select pl.limite_usuarios into v_limite
          from public.suscripciones s
          join public.planes pl on pl.id = s.plan_id
         where s.asociacion_id = p_asociacion_id;

        if v_limite is not null then
            select (select count(*) from public.profiles
                     where asociacion_id = p_asociacion_id and rol = 'recolector'
                       and id is distinct from v_perfil)
                 + (select count(*) from public.invitaciones
                     where asociacion_id = p_asociacion_id and aceptada_at is null
                       and lower(email) <> v_email)
              into v_usados;
            if v_usados >= v_limite then
                raise exception 'El plan de esta asociación permite % usuario(s) y ya alcanzó el límite', v_limite;
            end if;
        end if;
    end if;

    if v_perfil is not null then
        if v_perfil = auth.uid() then
            raise exception 'No puedes cambiar tu propio rol';
        end if;
        insert into public.profiles (id, email, rol, asociacion_id)
        values (v_perfil, v_email, p_rol, case when p_rol = 'recolector' then p_asociacion_id end)
        on conflict (id) do update
           set rol = excluded.rol,
               asociacion_id = excluded.asociacion_id;
        return 'vinculado';
    end if;

    delete from public.invitaciones where lower(email) = v_email and aceptada_at is null;
    insert into public.invitaciones (email, rol, asociacion_id)
    values (v_email, p_rol, case when p_rol = 'recolector' then p_asociacion_id end);
    return 'invitado';
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. RPC del panel de superadmin
-- ---------------------------------------------------------------------------

-- Todas las cuentas de auth.users con su perfil
create or replace function public.sa_listar_usuarios()
returns table (
    id                uuid,
    email             text,
    full_name         text,
    rol               text,
    asociacion_id     bigint,
    asociacion_nombre text,
    es_superadmin     boolean,
    suspendido_at     timestamptz,
    motivo_suspension text,
    creado_at         timestamptz,
    ultimo_acceso     timestamptz,
    correo_confirmado boolean
)
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
    if not public.is_superadmin() then
        raise exception 'Acceso sólo para superadministradores';
    end if;

    return query
    select u.id,
           u.email::text,
           coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name'),
           coalesce(p.rol, 'pendiente'),
           p.asociacion_id,
           a.nombre_asociacion,
           coalesce(p.es_superadmin, false),
           p.suspendido_at,
           p.motivo_suspension,
           u.created_at,
           u.last_sign_in_at,
           u.email_confirmed_at is not null
      from auth.users u
      left join public.profiles p on p.id = u.id
      left join public.asociaciones_recolectoras a on a.id = p.asociacion_id
     order by u.created_at desc;
end;
$$;

-- Cambiar rol / asociación de cualquier cuenta
create or replace function public.sa_actualizar_usuario(
    p_usuario uuid,
    p_rol text,
    p_asociacion_id bigint default null
)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_superadmin() then
        raise exception 'Acceso sólo para superadministradores';
    end if;
    if p_usuario = auth.uid() then
        raise exception 'No puedes cambiar tu propio rol';
    end if;
    if p_rol not in ('admin', 'recolector', 'pendiente') then
        raise exception 'Rol no válido';
    end if;
    if p_rol = 'recolector' and p_asociacion_id is null then
        raise exception 'Un usuario recolector debe estar ligado a una asociación';
    end if;
    if p_rol <> 'admin' and exists (select 1 from public.profiles where id = p_usuario and es_superadmin) then
        raise exception 'Quita primero el permiso de superadministrador';
    end if;

    insert into public.profiles (id, email, rol, asociacion_id)
    select u.id, u.email, p_rol, case when p_rol = 'recolector' then p_asociacion_id end
      from auth.users u
     where u.id = p_usuario
    on conflict (id) do update
       set rol = excluded.rol,
           asociacion_id = excluded.asociacion_id;

    if not found then
        raise exception 'Usuario no encontrado';
    end if;
end;
$$;

-- Suspender: sin acceso a datos, sin sesiones abiertas y sin poder entrar
create or replace function public.sa_suspender_usuario(p_usuario uuid, p_motivo text default null)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_superadmin() then
        raise exception 'Acceso sólo para superadministradores';
    end if;
    if p_usuario = auth.uid() then
        raise exception 'No puedes suspender tu propia cuenta';
    end if;
    if exists (select 1 from public.profiles where id = p_usuario and es_superadmin) then
        raise exception 'Quita primero el permiso de superadministrador';
    end if;

    update public.profiles
       set suspendido_at = now(),
           motivo_suspension = nullif(btrim(p_motivo), '')
     where id = p_usuario;
    if not found then
        raise exception 'Usuario no encontrado';
    end if;

    -- Supabase Auth rechaza el inicio de sesión mientras banned_until sea futuro
    update auth.users set banned_until = now() + interval '100 years' where id = p_usuario;
    delete from auth.sessions where user_id = p_usuario;
end;
$$;

create or replace function public.sa_reactivar_usuario(p_usuario uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_superadmin() then
        raise exception 'Acceso sólo para superadministradores';
    end if;

    update public.profiles
       set suspendido_at = null,
           motivo_suspension = null
     where id = p_usuario;
    if not found then
        raise exception 'Usuario no encontrado';
    end if;

    update auth.users set banned_until = null where id = p_usuario;
end;
$$;

-- Otorgar o quitar el permiso de superadmin (otorgarlo lo deja como admin)
create or replace function public.sa_cambiar_superadmin(p_usuario uuid, p_valor boolean)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_superadmin() then
        raise exception 'Acceso sólo para superadministradores';
    end if;
    if p_usuario = auth.uid() and not p_valor then
        raise exception 'No puedes quitarte a ti mismo el permiso de superadministrador';
    end if;
    if p_valor and exists (select 1 from public.profiles where id = p_usuario and suspendido_at is not null) then
        raise exception 'Reactiva la cuenta antes de hacerla superadministradora';
    end if;

    update public.profiles
       set es_superadmin = p_valor,
           rol = case when p_valor then 'admin' else rol end,
           asociacion_id = case when p_valor then null else asociacion_id end
     where id = p_usuario;
    if not found then
        raise exception 'Usuario no encontrado';
    end if;
end;
$$;

-- Borrar la cuenta de auth.users (el perfil se va en cascada; los registros
-- que la referencian conservan sus datos con el autor en null)
create or replace function public.sa_eliminar_usuario(p_usuario uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_superadmin() then
        raise exception 'Acceso sólo para superadministradores';
    end if;
    if p_usuario = auth.uid() then
        raise exception 'No puedes eliminar tu propia cuenta';
    end if;
    if exists (select 1 from public.profiles where id = p_usuario and es_superadmin) then
        raise exception 'Quita primero el permiso de superadministrador';
    end if;

    delete from auth.users where id = p_usuario;
    if not found then
        raise exception 'Usuario no encontrado';
    end if;
end;
$$;

-- Registrar un pago; si indica hasta cuándo cubre, extiende la vigencia y
-- una suscripción en prueba pasa a activa.
create or replace function public.sa_registrar_pago(
    p_suscripcion_id bigint,
    p_monto numeric,
    p_fecha_pago date default null,
    p_metodo text default 'transferencia',
    p_referencia text default null,
    p_cubre_hasta date default null,
    p_notas text default null
)
returns public.pagos_suscripcion
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_pago public.pagos_suscripcion;
begin
    if not public.is_superadmin() then
        raise exception 'Acceso sólo para superadministradores';
    end if;

    insert into public.pagos_suscripcion
        (suscripcion_id, monto, fecha_pago, metodo, referencia, cubre_hasta, notas)
    values
        (p_suscripcion_id, p_monto, coalesce(p_fecha_pago, public.hoy_local()),
         coalesce(p_metodo, 'transferencia'), nullif(btrim(p_referencia), ''), p_cubre_hasta,
         nullif(btrim(p_notas), ''))
    returning * into v_pago;

    if p_cubre_hasta is not null then
        update public.suscripciones
           set vence_el = greatest(coalesce(vence_el, p_cubre_hasta), p_cubre_hasta),
               estado = case when estado = 'prueba' then 'activa' else estado end
         where id = p_suscripcion_id;
    end if;

    return v_pago;
end;
$$;

-- Métricas: cuentas, tamaño de la base de datos, filas por tabla y Storage
create or replace function public.sa_metricas()
returns jsonb
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
    v_usuarios jsonb;
    v_tablas   jsonb := '[]'::jsonb;
    v_storage  jsonb;
    v_filas    bigint;
    r          record;
begin
    if not public.is_superadmin() then
        raise exception 'Acceso sólo para superadministradores';
    end if;

    select jsonb_build_object(
               'total',        count(*),
               'admin',        count(*) filter (where p.rol = 'admin'),
               'recolector',   count(*) filter (where p.rol = 'recolector'),
               'pendiente',    count(*) filter (where coalesce(p.rol, 'pendiente') = 'pendiente'),
               'superadmin',   count(*) filter (where p.es_superadmin),
               'suspendidos',  count(*) filter (where p.suspendido_at is not null),
               'sin_confirmar', count(*) filter (where u.email_confirmed_at is null),
               'nuevos_30d',   count(*) filter (where u.created_at >= now() - interval '30 days'),
               'activos_30d',  count(*) filter (where u.last_sign_in_at >= now() - interval '30 days')
           )
      into v_usuarios
      from auth.users u
      left join public.profiles p on p.id = u.id;

    for r in
        select c.relname, c.oid
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r'
         order by c.relname
    loop
        execute format('select count(*) from public.%I', r.relname) into v_filas;
        v_tablas := v_tablas || jsonb_build_object(
            'tabla', r.relname,
            'filas', v_filas,
            'bytes', pg_total_relation_size(r.oid)
        );
    end loop;

    select coalesce(jsonb_agg(x order by x ->> 'bucket'), '[]'::jsonb)
      into v_storage
      from (
          select jsonb_build_object(
                     'bucket',   b.id,
                     'publico',  b.public,
                     'archivos', count(o.id),
                     'bytes',    coalesce(sum((o.metadata ->> 'size')::bigint), 0)
                 ) as x
            from storage.buckets b
            left join storage.objects o on o.bucket_id = b.id
           group by b.id, b.public
      ) t;

    return jsonb_build_object(
        'usuarios',                v_usuarios,
        'invitaciones_pendientes', (select count(*) from public.invitaciones where aceptada_at is null),
        'bd_bytes',                pg_database_size(current_database()),
        'tablas',                  v_tablas,
        'storage',                 v_storage
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Permisos de ejecución
-- ---------------------------------------------------------------------------
revoke execute on function public.configuracion_set_updated() from public, anon, authenticated;
revoke execute on function public.suscripcion_vigente(bigint)  from public, anon, authenticated;

do $$
declare f text;
begin
    foreach f in array array[
        'is_superadmin()',
        'estado_efectivo_suscripcion(text, date)',
        'estado_mi_suscripcion()',
        'mi_acceso()',
        'configuracion_publica()',
        'crear_solicitud(text, numeric, date, text)',
        'invitar_usuario(text, text, bigint)',
        'sa_listar_usuarios()',
        'sa_actualizar_usuario(uuid, text, bigint)',
        'sa_suspender_usuario(uuid, text)',
        'sa_reactivar_usuario(uuid)',
        'sa_cambiar_superadmin(uuid, boolean)',
        'sa_eliminar_usuario(uuid)',
        'sa_registrar_pago(bigint, numeric, date, text, text, date, text)',
        'sa_metricas()'
    ] loop
        execute format('revoke execute on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;
