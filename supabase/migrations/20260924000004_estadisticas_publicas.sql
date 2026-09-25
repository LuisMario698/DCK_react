-- ============================================================================
-- Totales agregados para la landing pública
-- ----------------------------------------------------------------------------
-- La landing la ven visitantes anónimos y las tablas de manifiestos sólo son
-- legibles por administradores (RLS). Esta función SECURITY DEFINER devuelve
-- ÚNICAMENTE los siete totales que la landing ya muestra; no expone filas.
-- La usa lib/services/landing_stats.ts. Antes vivía suelta en
-- CREAR_FUNCION_ESTADISTICAS_PUBLICAS.sql y no estaba aplicada en el proyecto.
-- Idempotente.
-- ============================================================================

create or replace function public.estadisticas_publicas()
returns table (
    total_manifiestos  bigint,
    total_aceite_usado numeric,
    total_basura       numeric,
    total_basuron      numeric,
    filtros_aceite     bigint,
    filtros_diesel     bigint,
    filtros_aire       bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        (select count(*)                           from manifiestos),
        (select coalesce(sum(aceite_usado), 0)     from manifiestos_residuos),
        (select coalesce(sum(basura), 0)           from manifiestos_residuos),
        (select coalesce(sum(total_depositado), 0) from manifiesto_basuron),
        (select coalesce(sum(filtros_aceite), 0)   from manifiestos_residuos),
        (select coalesce(sum(filtros_diesel), 0)   from manifiestos_residuos),
        (select coalesce(sum(filtros_aire), 0)     from manifiestos_residuos);
$$;

revoke all on function public.estadisticas_publicas() from public;
grant execute on function public.estadisticas_publicas() to anon, authenticated;
