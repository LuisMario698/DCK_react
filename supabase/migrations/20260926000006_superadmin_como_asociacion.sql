-- ============================================================================
-- El superadmin también opera como asociación recolectora
-- ----------------------------------------------------------------------------
-- Un superadmin conserva el rol 'admin' (recinto portuario) y además puede
-- quedar vinculado a una asociación (`profiles.asociacion_id`) para usar el
-- portal recolector a nombre de ella. La elige desde /superadmin.
--
-- Como sigue siendo admin, la RLS le deja ver todo; por eso el portal filtra
-- explícitamente por su asociación, y las RPC que dependen del rol reciben
-- `p_como = 'recolector'` cuando se llaman desde el portal.
--
-- Requiere 20260925000005_panel_superadmin.sql. Idempotente.
-- ============================================================================

-- 1. La asociación del superadmin cuenta como "la mía"
create or replace function public.get_my_asociacion_id()
returns bigint
language sql stable security definer
set search_path = public, pg_temp
as $$
    select asociacion_id from public.profiles
     where id = auth.uid()
       and suspendido_at is null
       and (rol = 'recolector' or es_superadmin)
$$;

-- 2. Mensajes: desde el portal, el superadmin escribe como su asociación.
--    El cliente sólo puede pedirlo mandando autor_rol = 'recolector'; para
--    cualquier otro usuario el autor y su rol siguen saliendo de la sesión.
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
    if v_rol = 'admin' and new.autor_rol = 'recolector' and public.is_superadmin() then
        if new.asociacion_id is distinct from public.get_my_asociacion_id() then
            raise exception 'Sólo puedes escribir como la asociación que tienes vinculada';
        end if;
        v_rol := 'recolector';
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

-- 3. Marcar como leído: `p_como = 'recolector'` sólo tiene efecto para un
--    superadmin (portal recolector); sin él se comporta como antes.
drop function if exists public.marcar_mensajes_leidos(bigint);
create or replace function public.marcar_mensajes_leidos(p_asociacion_id bigint, p_como text default null)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_rol text := public.get_my_role();
begin
    if p_como = 'recolector' and v_rol = 'admin' and public.is_superadmin() then
        v_rol := 'recolector';
    end if;
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

drop function if exists public.marcar_notificaciones_leidas(bigint[]);
create or replace function public.marcar_notificaciones_leidas(p_ids bigint[] default null, p_como text default null)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_rol text := public.get_my_role();
begin
    if p_como = 'recolector' and v_rol = 'admin' and public.is_superadmin() then
        v_rol := 'recolector';
    end if;
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

-- 4. El middleware necesita saber si el superadmin tiene asociación
create or replace function public.mi_acceso()
returns jsonb
language sql stable security definer
set search_path = public, pg_temp
as $$
    select jsonb_build_object(
        'rol',           coalesce(p.rol, 'pendiente'),
        'es_superadmin', coalesce(p.es_superadmin, false),
        'asociacion_id', p.asociacion_id,
        'suspendida',    p.suspendido_at is not null,
        'mantenimiento', coalesce((select (valor ->> 'activo')::boolean
                                     from public.configuracion_sistema where clave = 'mantenimiento'), false)
    )
    from (select auth.uid() as uid) s
    left join public.profiles p on p.id = s.uid
$$;

-- 5. El superadmin elige (o quita) su asociación
create or replace function public.sa_vincular_mi_asociacion(p_asociacion_id bigint)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_superadmin() then
        raise exception 'Acceso sólo para superadministradores';
    end if;
    if p_asociacion_id is not null
       and not exists (select 1 from public.asociaciones_recolectoras where id = p_asociacion_id) then
        raise exception 'La asociación no existe';
    end if;
    update public.profiles set asociacion_id = p_asociacion_id where id = auth.uid();
end;
$$;

-- 6. Otorgar superadmin ya no borra la asociación (la conserva para el portal)
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
           -- Un admin normal no lleva asociación: al quitar el permiso se desvincula
           asociacion_id = case when p_valor or rol = 'recolector' then asociacion_id end
     where id = p_usuario;
    if not found then
        raise exception 'Usuario no encontrado';
    end if;
end;
$$;

-- 7. A otro superadmin también se le puede asignar asociación desde Cuentas
create or replace function public.sa_actualizar_usuario(
    p_usuario uuid,
    p_rol text,
    p_asociacion_id bigint default null
)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_es_super boolean := exists (select 1 from public.profiles where id = p_usuario and es_superadmin);
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
    if p_rol <> 'admin' and v_es_super then
        raise exception 'Quita primero el permiso de superadministrador';
    end if;

    insert into public.profiles (id, email, rol, asociacion_id)
    select u.id, u.email, p_rol,
           case when p_rol = 'recolector' or v_es_super then p_asociacion_id end
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

-- 8. Permisos
do $$
declare f text;
begin
    foreach f in array array[
        'marcar_mensajes_leidos(bigint, text)',
        'marcar_notificaciones_leidas(bigint[], text)',
        'mi_acceso()',
        'sa_vincular_mi_asociacion(bigint)',
        'sa_cambiar_superadmin(uuid, boolean)',
        'sa_actualizar_usuario(uuid, text, bigint)'
    ] loop
        execute format('revoke execute on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;
