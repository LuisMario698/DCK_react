-- ============================================================================
-- Fase 1 · E2 — Módulo de asociaciones recolectoras
-- ----------------------------------------------------------------------------
-- Flujo: el admin publica inventario → la asociación crea una solicitud →
-- el admin la aprueba (se descuenta del inventario) o la rechaza → al
-- recolectar, el admin la completa con la cantidad real (se ajusta la
-- diferencia) y se genera una fila en `recolecciones` con folio y comprobante.
--
-- Las escrituras sobre solicitudes pasan SIEMPRE por las funciones RPC de
-- este archivo (validan rol, estado e inventario en una sola transacción);
-- las tablas sólo exponen políticas de lectura para esos casos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Catálogo de tipos de residuo
-- ---------------------------------------------------------------------------
do $$
begin
    if not exists (select 1 from pg_type where typname = 'tipo_residuo' and typnamespace = 'public'::regnamespace) then
        create domain public.tipo_residuo as text
            check (value in ('plastico', 'aceite', 'carton', 'chatarra', 'vidrio', 'organico', 'filtros'));
    end if;
    if not exists (select 1 from pg_type where typname = 'unidad_residuo' and typnamespace = 'public'::regnamespace) then
        create domain public.unidad_residuo as text
            check (value in ('kg', 'L', 'pz'));
    end if;
end $$;

create or replace function public.etiqueta_residuo(p_tipo text)
returns text
language sql immutable
as $$
    select case p_tipo
        when 'plastico' then 'Plástico'
        when 'aceite'   then 'Aceite usado'
        when 'carton'   then 'Cartón'
        when 'chatarra' then 'Chatarra metálica'
        when 'vidrio'   then 'Vidrio'
        when 'organico' then 'Orgánico'
        when 'filtros'  then 'Filtros usados'
        else p_tipo
    end
$$;

-- Cantidad legible para textos de notificación: 500.00 → '500', 12.50 → '12.5'
create or replace function public.formato_cantidad(p numeric)
returns text
language sql immutable
as $$
    select case when p = trunc(p) then trunc(p)::bigint::text else rtrim(p::text, '0') end
$$;

-- Fecha local del centro de acopio (Puerto Peñasco, UTC-7 sin horario de verano)
create or replace function public.hoy_local()
returns date
language sql stable
as $$
    select (now() at time zone 'America/Hermosillo')::date
$$;

-- ---------------------------------------------------------------------------
-- 2. Datos adicionales de la asociación
-- ---------------------------------------------------------------------------
alter table public.asociaciones_recolectoras
    add column if not exists rfc text,
    add column if not exists descripcion text,
    add column if not exists sitio_web text,
    add column if not exists ubicacion text,
    add column if not exists tipos_residuo text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- 3. Inventario publicado (una fila por tipo de residuo)
--    `cantidad` = disponible para nuevas solicitudes.
-- ---------------------------------------------------------------------------
create table if not exists public.inventario_residuos (
    id          bigint generated always as identity primary key,
    tipo        public.tipo_residuo not null unique,
    cantidad    numeric(12, 2) not null default 0 check (cantidad >= 0),
    unidad      public.unidad_residuo not null,
    notas       text,
    publicado   boolean not null default true,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now(),
    updated_by  uuid default auth.uid() references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- 4. Solicitudes de recolección
-- ---------------------------------------------------------------------------
create table if not exists public.solicitudes_recoleccion (
    id                   bigint generated always as identity primary key,
    asociacion_id        bigint not null references public.asociaciones_recolectoras (id) on delete cascade,
    tipo                 public.tipo_residuo not null,
    cantidad_solicitada  numeric(12, 2) not null check (cantidad_solicitada > 0),
    cantidad_aprobada    numeric(12, 2) check (cantidad_aprobada > 0),
    unidad               public.unidad_residuo not null,
    fecha_propuesta      date not null,
    mensaje              text,
    estado               text not null default 'pendiente'
                         check (estado in ('pendiente', 'aprobada', 'rechazada', 'completada', 'cancelada')),
    motivo_rechazo       text,
    creada_por           uuid default auth.uid() references auth.users (id) on delete set null,
    resuelta_por         uuid references auth.users (id) on delete set null,
    resuelta_at          timestamptz,
    created_at           timestamptz default now(),
    updated_at           timestamptz default now()
);

create index if not exists idx_solicitudes_asociacion on public.solicitudes_recoleccion (asociacion_id);
create index if not exists idx_solicitudes_estado on public.solicitudes_recoleccion (estado);

-- ---------------------------------------------------------------------------
-- 5. Recolecciones realizadas (con folio y comprobante PDF)
-- ---------------------------------------------------------------------------
create sequence if not exists public.recolecciones_folio_seq;

create table if not exists public.recolecciones (
    id                   bigint generated always as identity primary key,
    folio                text not null unique,
    solicitud_id         bigint not null unique references public.solicitudes_recoleccion (id) on delete restrict,
    asociacion_id        bigint not null references public.asociaciones_recolectoras (id) on delete restrict,
    tipo                 public.tipo_residuo not null,
    cantidad             numeric(12, 2) not null check (cantidad > 0),
    unidad               public.unidad_residuo not null,
    fecha                date not null default public.hoy_local(),
    entregado_por        text,
    recibido_por         text,
    observaciones        text,
    comprobante_pdf_path text,
    registrada_por       uuid default auth.uid() references auth.users (id) on delete set null,
    created_at           timestamptz default now()
);

create index if not exists idx_recolecciones_asociacion on public.recolecciones (asociacion_id);
create index if not exists idx_recolecciones_fecha on public.recolecciones (fecha);

-- ---------------------------------------------------------------------------
-- 6. Mensajes (una conversación por asociación con el centro de acopio)
-- ---------------------------------------------------------------------------
create table if not exists public.mensajes (
    id             bigint generated always as identity primary key,
    asociacion_id  bigint not null references public.asociaciones_recolectoras (id) on delete cascade,
    autor_id       uuid default auth.uid() references auth.users (id) on delete set null,
    autor_rol      text not null check (autor_rol in ('admin', 'recolector')),
    texto          text not null check (char_length(btrim(texto)) between 1 and 2000),
    leido_at       timestamptz,
    created_at     timestamptz default now()
);

create index if not exists idx_mensajes_asociacion on public.mensajes (asociacion_id, created_at);

-- ---------------------------------------------------------------------------
-- 7. Notificaciones
-- ---------------------------------------------------------------------------
create table if not exists public.notificaciones (
    id             bigint generated always as identity primary key,
    destinatario   text not null check (destinatario in ('admin', 'recolector')),
    asociacion_id  bigint references public.asociaciones_recolectoras (id) on delete cascade,
    tipo           text not null
                   check (tipo in ('nueva_solicitud', 'aprobada', 'rechazada', 'completada', 'cancelada', 'nuevo_residuo')),
    titulo         text not null,
    detalle        text,
    leida          boolean not null default false,
    created_at     timestamptz default now(),
    constraint notificaciones_recolector_con_asociacion
        check (destinatario <> 'recolector' or asociacion_id is not null)
);

create index if not exists idx_notificaciones_destino on public.notificaciones (destinatario, asociacion_id, leida);

-- ---------------------------------------------------------------------------
-- 8. Triggers de mantenimiento (updated_at + bitácora de auditoría)
-- ---------------------------------------------------------------------------
drop trigger if exists trg_inventario_updated_at on public.inventario_residuos;
create trigger trg_inventario_updated_at before update on public.inventario_residuos
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_solicitudes_updated_at on public.solicitudes_recoleccion;
create trigger trg_solicitudes_updated_at before update on public.solicitudes_recoleccion
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_audit_inventario on public.inventario_residuos;
create trigger trg_audit_inventario after insert or update or delete on public.inventario_residuos
    for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_solicitudes on public.solicitudes_recoleccion;
create trigger trg_audit_solicitudes after insert or update or delete on public.solicitudes_recoleccion
    for each row execute function public.audit_trigger_fn();

drop trigger if exists trg_audit_recolecciones on public.recolecciones;
create trigger trg_audit_recolecciones after insert or update or delete on public.recolecciones
    for each row execute function public.audit_trigger_fn();

-- El inventario registra quién lo modificó
create or replace function public.inventario_set_updated_by()
returns trigger
language plpgsql
as $$
begin
    new.updated_by := coalesce(auth.uid(), new.updated_by);
    return new;
end;
$$;

drop trigger if exists trg_inventario_updated_by on public.inventario_residuos;
create trigger trg_inventario_updated_by before insert or update on public.inventario_residuos
    for each row execute function public.inventario_set_updated_by();

-- Los mensajes toman autor y rol de la sesión, no del cliente
create or replace function public.mensajes_set_autor()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_rol text := public.get_my_role();
begin
    if v_rol not in ('admin', 'recolector') then
        raise exception 'No tienes permiso para enviar mensajes';
    end if;
    new.autor_id := auth.uid();
    new.autor_rol := v_rol;
    new.leido_at := null;
    new.texto := btrim(new.texto);
    if v_rol = 'recolector' then
        new.asociacion_id := public.get_my_asociacion_id();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_mensajes_autor on public.mensajes;
create trigger trg_mensajes_autor before insert on public.mensajes
    for each row execute function public.mensajes_set_autor();

-- ---------------------------------------------------------------------------
-- 9. Notificaciones automáticas
-- ---------------------------------------------------------------------------
create or replace function public.notificar_cambio_solicitud()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_nombre  text;
    v_detalle text;
    v_cant    numeric;
begin
    select nombre_asociacion into v_nombre
      from public.asociaciones_recolectoras where id = new.asociacion_id;

    v_cant := coalesce(new.cantidad_aprobada, new.cantidad_solicitada);
    if new.estado = 'completada' then
        -- La cantidad real es la registrada en la recolección
        select cantidad into v_cant from public.recolecciones where solicitud_id = new.id;
        v_cant := coalesce(v_cant, new.cantidad_aprobada, new.cantidad_solicitada);
    end if;
    v_detalle := public.formato_cantidad(v_cant) || ' ' || new.unidad
                 || ' de ' || lower(public.etiqueta_residuo(new.tipo));

    if tg_op = 'INSERT' then
        insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle)
        values ('admin', new.asociacion_id, 'nueva_solicitud',
                'Nueva solicitud de ' || coalesce(v_nombre, 'una asociación'), v_detalle);
        return new;
    end if;

    if new.estado is not distinct from old.estado then
        return new;
    end if;

    if new.estado = 'aprobada' then
        insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle)
        values ('recolector', new.asociacion_id, 'aprobada', 'Solicitud aprobada',
                v_detalle || ' · recolección el ' || to_char(new.fecha_propuesta, 'DD/MM/YYYY'));
    elsif new.estado = 'rechazada' then
        insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle)
        values ('recolector', new.asociacion_id, 'rechazada', 'Solicitud rechazada',
                v_detalle || coalesce(' · ' || new.motivo_rechazo, ''));
    elsif new.estado = 'completada' then
        insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle)
        values ('recolector', new.asociacion_id, 'completada', 'Recolección completada',
                v_detalle || ' · comprobante disponible en tu historial');
    elsif new.estado = 'cancelada' then
        if public.get_my_role() = 'recolector' then
            insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle)
            values ('admin', new.asociacion_id, 'cancelada',
                    coalesce(v_nombre, 'Una asociación') || ' canceló su solicitud', v_detalle);
        else
            insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle)
            values ('recolector', new.asociacion_id, 'cancelada', 'Solicitud cancelada por el centro de acopio',
                    v_detalle);
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_notificar_solicitud on public.solicitudes_recoleccion;
create trigger trg_notificar_solicitud
    after insert or update of estado on public.solicitudes_recoleccion
    for each row execute function public.notificar_cambio_solicitud();

-- Aviso a las asociaciones activas que manejan ese residuo cuando aumenta la
-- cantidad publicada (o se publica un residuo nuevo).
create or replace function public.notificar_nuevo_residuo()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
    if not new.publicado or new.cantidad <= 0 then
        return new;
    end if;
    -- Las devoluciones que hacen las RPC (cancelar/completar) no son residuo nuevo
    if current_setting('simar.ajuste_interno', true) = '1' then
        return new;
    end if;
    if tg_op = 'UPDATE' and old.publicado and new.cantidad <= old.cantidad then
        return new;
    end if;

    insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle)
    select 'recolector', a.id, 'nuevo_residuo', 'Nuevo residuo disponible',
           'Puerto Peñasco · ' || public.formato_cantidad(new.cantidad) || ' ' || new.unidad
           || ' de ' || lower(public.etiqueta_residuo(new.tipo))
      from public.asociaciones_recolectoras a
     where a.estado = 'Activo'
       and (cardinality(a.tipos_residuo) = 0 or new.tipo = any (a.tipos_residuo));

    return new;
end;
$$;

drop trigger if exists trg_notificar_residuo on public.inventario_residuos;
create trigger trg_notificar_residuo
    after insert or update of cantidad, publicado on public.inventario_residuos
    for each row execute function public.notificar_nuevo_residuo();

-- ---------------------------------------------------------------------------
-- 10. RLS
-- ---------------------------------------------------------------------------
alter table public.inventario_residuos     enable row level security;
alter table public.solicitudes_recoleccion enable row level security;
alter table public.recolecciones           enable row level security;
alter table public.mensajes                enable row level security;
alter table public.notificaciones          enable row level security;

-- Inventario: admin lo gestiona; el recolector ve lo publicado
drop policy if exists inventario_select on public.inventario_residuos;
create policy inventario_select on public.inventario_residuos
    for select to authenticated
    using (public.is_admin() or (publicado and public.get_my_role() = 'recolector'));

drop policy if exists inventario_admin_insert on public.inventario_residuos;
create policy inventario_admin_insert on public.inventario_residuos
    for insert to authenticated with check (public.is_admin());

drop policy if exists inventario_admin_update on public.inventario_residuos;
create policy inventario_admin_update on public.inventario_residuos
    for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists inventario_admin_delete on public.inventario_residuos;
create policy inventario_admin_delete on public.inventario_residuos
    for delete to authenticated using (public.is_admin());

-- Solicitudes: sólo lectura (las escrituras van por RPC)
drop policy if exists solicitudes_select on public.solicitudes_recoleccion;
create policy solicitudes_select on public.solicitudes_recoleccion
    for select to authenticated
    using (public.is_admin() or asociacion_id = public.get_my_asociacion_id());

-- Recolecciones: lectura propia; el admin actualiza el comprobante
drop policy if exists recolecciones_select on public.recolecciones;
create policy recolecciones_select on public.recolecciones
    for select to authenticated
    using (public.is_admin() or asociacion_id = public.get_my_asociacion_id());

drop policy if exists recolecciones_admin_update on public.recolecciones;
create policy recolecciones_admin_update on public.recolecciones
    for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Mensajes
drop policy if exists mensajes_select on public.mensajes;
create policy mensajes_select on public.mensajes
    for select to authenticated
    using (public.is_admin() or asociacion_id = public.get_my_asociacion_id());

drop policy if exists mensajes_insert on public.mensajes;
create policy mensajes_insert on public.mensajes
    for insert to authenticated
    with check (public.is_admin() or asociacion_id = public.get_my_asociacion_id());

-- Notificaciones
drop policy if exists notificaciones_select on public.notificaciones;
create policy notificaciones_select on public.notificaciones
    for select to authenticated
    using (
        (destinatario = 'admin' and public.is_admin())
        or (destinatario = 'recolector' and asociacion_id = public.get_my_asociacion_id())
    );

-- ---------------------------------------------------------------------------
-- 11. Funciones RPC del flujo
-- ---------------------------------------------------------------------------

-- Crear solicitud (recolector)
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

-- Aprobar (admin): descuenta del inventario
create or replace function public.aprobar_solicitud(p_id bigint, p_cantidad numeric default null)
returns public.solicitudes_recoleccion
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_sol  public.solicitudes_recoleccion;
    v_inv  public.inventario_residuos%rowtype;
    v_cant numeric;
begin
    if not public.is_admin() then
        raise exception 'Sólo un administrador puede aprobar solicitudes';
    end if;

    select * into v_sol from public.solicitudes_recoleccion where id = p_id for update;
    if not found then raise exception 'La solicitud no existe'; end if;
    if v_sol.estado <> 'pendiente' then
        raise exception 'Sólo se pueden aprobar solicitudes pendientes (estado actual: %)', v_sol.estado;
    end if;

    v_cant := coalesce(p_cantidad, v_sol.cantidad_solicitada);
    if v_cant <= 0 or v_cant > v_sol.cantidad_solicitada then
        raise exception 'La cantidad aprobada debe estar entre 0 y %', v_sol.cantidad_solicitada;
    end if;

    select * into v_inv from public.inventario_residuos where tipo = v_sol.tipo for update;
    if not found or v_inv.cantidad < v_cant then
        raise exception 'Inventario insuficiente: hay % % disponibles', coalesce(v_inv.cantidad, 0), v_sol.unidad;
    end if;

    update public.inventario_residuos set cantidad = cantidad - v_cant where id = v_inv.id;

    update public.solicitudes_recoleccion
       set estado = 'aprobada', cantidad_aprobada = v_cant,
           resuelta_por = auth.uid(), resuelta_at = now()
     where id = p_id
    returning * into v_sol;

    return v_sol;
end;
$$;

-- Rechazar (admin)
create or replace function public.rechazar_solicitud(p_id bigint, p_motivo text)
returns public.solicitudes_recoleccion
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_sol public.solicitudes_recoleccion;
begin
    if not public.is_admin() then
        raise exception 'Sólo un administrador puede rechazar solicitudes';
    end if;
    if nullif(btrim(p_motivo), '') is null then
        raise exception 'Indica el motivo del rechazo';
    end if;

    select * into v_sol from public.solicitudes_recoleccion where id = p_id for update;
    if not found then raise exception 'La solicitud no existe'; end if;
    if v_sol.estado <> 'pendiente' then
        raise exception 'Sólo se pueden rechazar solicitudes pendientes (estado actual: %)', v_sol.estado;
    end if;

    update public.solicitudes_recoleccion
       set estado = 'rechazada', motivo_rechazo = btrim(p_motivo),
           resuelta_por = auth.uid(), resuelta_at = now()
     where id = p_id
    returning * into v_sol;

    return v_sol;
end;
$$;

-- Cancelar: el recolector (sólo pendientes propias) o el admin (pendiente o
-- aprobada; si estaba aprobada, la cantidad regresa al inventario)
create or replace function public.cancelar_solicitud(p_id bigint)
returns public.solicitudes_recoleccion
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_sol public.solicitudes_recoleccion;
    v_admin boolean := public.is_admin();
begin
    select * into v_sol from public.solicitudes_recoleccion where id = p_id for update;
    if not found then raise exception 'La solicitud no existe'; end if;

    if v_admin then
        if v_sol.estado not in ('pendiente', 'aprobada') then
            raise exception 'No se puede cancelar una solicitud %', v_sol.estado;
        end if;
    else
        if v_sol.asociacion_id is distinct from public.get_my_asociacion_id() then
            raise exception 'La solicitud no pertenece a tu asociación';
        end if;
        if v_sol.estado <> 'pendiente' then
            raise exception 'Sólo puedes cancelar solicitudes pendientes';
        end if;
    end if;

    if v_sol.estado = 'aprobada' then
        perform set_config('simar.ajuste_interno', '1', true);
        update public.inventario_residuos
           set cantidad = cantidad + v_sol.cantidad_aprobada
         where tipo = v_sol.tipo;
        perform set_config('simar.ajuste_interno', '', true);
    end if;

    update public.solicitudes_recoleccion
       set estado = 'cancelada', resuelta_por = auth.uid(), resuelta_at = now()
     where id = p_id
    returning * into v_sol;

    return v_sol;
end;
$$;

-- Completar (admin): registra la recolección con la cantidad real
create or replace function public.completar_solicitud(
    p_id bigint,
    p_cantidad_real numeric,
    p_entregado_por text default null,
    p_recibido_por text default null,
    p_observaciones text default null
)
returns public.recolecciones
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_sol  public.solicitudes_recoleccion;
    v_inv  public.inventario_residuos%rowtype;
    v_dif  numeric;
    v_rec  public.recolecciones;
begin
    if not public.is_admin() then
        raise exception 'Sólo un administrador puede completar recolecciones';
    end if;

    select * into v_sol from public.solicitudes_recoleccion where id = p_id for update;
    if not found then raise exception 'La solicitud no existe'; end if;
    if v_sol.estado <> 'aprobada' then
        raise exception 'Sólo se pueden completar solicitudes aprobadas (estado actual: %)', v_sol.estado;
    end if;
    if p_cantidad_real is null or p_cantidad_real <= 0 then
        raise exception 'La cantidad recolectada debe ser mayor que cero';
    end if;

    -- Diferencia entre lo aprobado (ya descontado) y lo que realmente se llevó
    v_dif := v_sol.cantidad_aprobada - p_cantidad_real;
    select * into v_inv from public.inventario_residuos where tipo = v_sol.tipo for update;
    if v_dif < 0 and (v_inv.id is null or v_inv.cantidad < -v_dif) then
        raise exception 'No hay inventario suficiente para cubrir % % extra', -v_dif, v_sol.unidad;
    end if;
    if v_dif <> 0 and v_inv.id is not null then
        perform set_config('simar.ajuste_interno', '1', true);
        update public.inventario_residuos set cantidad = cantidad + v_dif where id = v_inv.id;
        perform set_config('simar.ajuste_interno', '', true);
    end if;

    insert into public.recolecciones
        (folio, solicitud_id, asociacion_id, tipo, cantidad, unidad,
         entregado_por, recibido_por, observaciones)
    values
        ('REC-' || to_char(public.hoy_local(), 'YYYY') || '-'
             || lpad(nextval('public.recolecciones_folio_seq')::text, 5, '0'),
         v_sol.id, v_sol.asociacion_id, v_sol.tipo, p_cantidad_real, v_sol.unidad,
         nullif(btrim(p_entregado_por), ''), nullif(btrim(p_recibido_por), ''),
         nullif(btrim(p_observaciones), ''))
    returning * into v_rec;

    update public.solicitudes_recoleccion
       set estado = 'completada', resuelta_por = auth.uid(), resuelta_at = now()
     where id = p_id;

    return v_rec;
end;
$$;

-- Marcar como leídos los mensajes que envió la otra parte
create or replace function public.marcar_mensajes_leidos(p_asociacion_id bigint)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_rol text := public.get_my_role();
begin
    if v_rol = 'admin' then
        update public.mensajes set leido_at = now()
         where asociacion_id = p_asociacion_id and autor_rol = 'recolector' and leido_at is null;
    elsif v_rol = 'recolector' and p_asociacion_id = public.get_my_asociacion_id() then
        update public.mensajes set leido_at = now()
         where asociacion_id = p_asociacion_id and autor_rol = 'admin' and leido_at is null;
    else
        raise exception 'No tienes acceso a esta conversación';
    end if;
end;
$$;

-- Marcar notificaciones como leídas (todas las visibles si p_ids es null)
create or replace function public.marcar_notificaciones_leidas(p_ids bigint[] default null)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_rol text := public.get_my_role();
begin
    if v_rol = 'admin' then
        update public.notificaciones set leida = true
         where destinatario = 'admin' and not leida
           and (p_ids is null or id = any (p_ids));
    elsif v_rol = 'recolector' then
        update public.notificaciones set leida = true
         where destinatario = 'recolector' and asociacion_id = public.get_my_asociacion_id()
           and not leida and (p_ids is null or id = any (p_ids));
    end if;
end;
$$;

-- El recolector edita los datos de contacto de su asociación
-- (nombre, RFC y estado sólo los cambia el admin)
create or replace function public.actualizar_mi_asociacion(
    p_contacto text,
    p_email text,
    p_telefono text,
    p_direccion text,
    p_ubicacion text,
    p_sitio_web text,
    p_descripcion text,
    p_tipos_residuo text[]
)
returns public.asociaciones_recolectoras
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_id  bigint := public.get_my_asociacion_id();
    v_row public.asociaciones_recolectoras;
begin
    if v_id is null then
        raise exception 'Tu usuario no está vinculado a una asociación recolectora';
    end if;
    if exists (
        select 1 from unnest(coalesce(p_tipos_residuo, '{}')) t
         where t not in ('plastico', 'aceite', 'carton', 'chatarra', 'vidrio', 'organico', 'filtros')
    ) then
        raise exception 'Tipo de residuo no válido';
    end if;

    update public.asociaciones_recolectoras
       set contacto_asociacion = nullif(btrim(p_contacto), ''),
           email               = nullif(btrim(p_email), ''),
           telefono            = nullif(btrim(p_telefono), ''),
           direccion           = nullif(btrim(p_direccion), ''),
           ubicacion           = nullif(btrim(p_ubicacion), ''),
           sitio_web           = nullif(btrim(p_sitio_web), ''),
           descripcion         = nullif(btrim(p_descripcion), ''),
           tipos_residuo       = coalesce(p_tipos_residuo, '{}')
     where id = v_id
    returning * into v_row;

    return v_row;
end;
$$;

-- Invitar / vincular un usuario (admin). Si el correo ya tiene cuenta, se
-- actualiza su perfil de inmediato; si no, queda una invitación pendiente
-- que se aplica cuando se registre.
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
    v_email text := lower(btrim(p_email));
    v_perfil uuid;
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

-- Quitar acceso a un usuario (admin): vuelve a 'pendiente'
create or replace function public.revocar_acceso(p_usuario uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin() then
        raise exception 'Sólo un administrador puede quitar accesos';
    end if;
    if p_usuario = auth.uid() then
        raise exception 'No puedes quitarte el acceso a ti mismo';
    end if;
    update public.profiles set rol = 'pendiente', asociacion_id = null where id = p_usuario;
end;
$$;

-- Permisos de ejecución: sólo usuarios autenticados
do $$
declare f text;
begin
    foreach f in array array[
        'crear_solicitud(text, numeric, date, text)',
        'aprobar_solicitud(bigint, numeric)',
        'rechazar_solicitud(bigint, text)',
        'cancelar_solicitud(bigint)',
        'completar_solicitud(bigint, numeric, text, text, text)',
        'marcar_mensajes_leidos(bigint)',
        'marcar_notificaciones_leidas(bigint[])',
        'actualizar_mi_asociacion(text, text, text, text, text, text, text, text[])',
        'invitar_usuario(text, text, bigint)',
        'revocar_acceso(uuid)'
    ] loop
        execute format('revoke execute on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 12. Bucket privado para comprobantes de recolección
--     Ruta de los archivos: {asociacion_id}/{folio}.pdf
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('recolecciones_pdf', 'recolecciones_pdf', false)
on conflict (id) do nothing;

drop policy if exists recolecciones_pdf_select on storage.objects;
create policy recolecciones_pdf_select on storage.objects
    for select to authenticated
    using (
        bucket_id = 'recolecciones_pdf'
        and (public.is_admin() or (storage.foldername(name))[1] = public.get_my_asociacion_id()::text)
    );

drop policy if exists recolecciones_pdf_insert on storage.objects;
create policy recolecciones_pdf_insert on storage.objects
    for insert to authenticated
    with check (bucket_id = 'recolecciones_pdf' and public.is_admin());

drop policy if exists recolecciones_pdf_update on storage.objects;
create policy recolecciones_pdf_update on storage.objects
    for update to authenticated
    using (bucket_id = 'recolecciones_pdf' and public.is_admin());

drop policy if exists recolecciones_pdf_delete on storage.objects;
create policy recolecciones_pdf_delete on storage.objects
    for delete to authenticated
    using (bucket_id = 'recolecciones_pdf' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 13. Realtime (chat, notificaciones y cambios de estado en vivo)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
    foreach t in array array['mensajes', 'notificaciones', 'solicitudes_recoleccion', 'inventario_residuos'] loop
        if not exists (
            select 1 from pg_publication_tables
             where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
        ) then
            execute format('alter publication supabase_realtime add table public.%I', t);
        end if;
    end loop;
end $$;
