-- ============================================================================
-- Fase 1 — Ajustes señalados por los advisors de Supabase
-- ----------------------------------------------------------------------------
-- * search_path fijo en las funciones auxiliares.
-- * Las funciones de trigger y las auxiliares de RLS no deben poder llamarse
--   como RPC desde el rol `anon`.
-- * Políticas de profiles con (select auth.uid()) para no recalcularlo por fila.
-- * Índices para las llaves foráneas que se filtran con frecuencia.
-- Idempotente: se puede volver a ejecutar.
-- ============================================================================

-- 1. search_path fijo
alter function public.etiqueta_residuo(text)       set search_path = public, pg_temp;
alter function public.formato_cantidad(numeric)    set search_path = public, pg_temp;
alter function public.hoy_local()                  set search_path = public, pg_temp;
alter function public.inventario_set_updated_by()  set search_path = public, pg_temp;

-- 2. Permisos de ejecución
--    Funciones de trigger: nadie las llama directamente (los triggers no
--    requieren EXECUTE del usuario que dispara el evento).
revoke execute on function public.mensajes_set_autor()          from public, anon, authenticated;
revoke execute on function public.notificar_cambio_solicitud()  from public, anon, authenticated;
revoke execute on function public.notificar_nuevo_residuo()     from public, anon, authenticated;
revoke execute on function public.inventario_set_updated_by()   from public, anon, authenticated;
revoke execute on function public.proteger_campos_perfil()      from public, anon, authenticated;
revoke execute on function public.handle_new_user()             from public, anon, authenticated;

--    Auxiliares de RLS: las necesitan los usuarios autenticados (las políticas
--    se evalúan con sus permisos), pero no el rol anónimo.
revoke execute on function public.get_my_role()          from public, anon;
revoke execute on function public.is_admin()             from public, anon;
revoke execute on function public.get_my_asociacion_id() from public, anon;
grant  execute on function public.get_my_role()          to authenticated;
grant  execute on function public.is_admin()             to authenticated;
grant  execute on function public.get_my_asociacion_id() to authenticated;

-- 3. Políticas de profiles: auth.uid() / is_admin() se evalúan una sola vez
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
    for select to authenticated
    using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
    for update to authenticated
    using (id = (select auth.uid()) or (select public.is_admin()))
    with check (id = (select auth.uid()) or (select public.is_admin()));

-- 4. Índices de llaves foráneas usadas en filtros
create index if not exists idx_notificaciones_asociacion on public.notificaciones (asociacion_id);
create index if not exists idx_invitaciones_asociacion   on public.invitaciones (asociacion_id);
