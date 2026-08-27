-- =====================================================================
--  Totales agregados para la landing pública  (EJECUTAR EN SUPABASE)
-- =====================================================================
--
--  PROBLEMA QUE RESUELVE
--  La landing (`/es`, `/en`) la ven visitantes ANÓNIMOS. Las políticas RLS
--  de `manifiestos`, `manifiestos_residuos` y `manifiesto_basuron` sólo
--  conceden acceso al rol `authenticated`, así que las consultas de
--  `lib/services/landing_stats.ts` devolvían [] (status 200, sin error) y la
--  sección "DATOS REALES DE NUESTRA BASE DE DATOS" mostraba 0.0 en todas las
--  equivalencias, mientras más arriba la misma página anunciaba "5,000+".
--
--  POR QUÉ UNA FUNCIÓN Y NO UNA POLICY PARA `anon`
--  Una policy de SELECT abriría TODAS las filas (nombres de buques,
--  responsables, pesos y fechas) a cualquiera con la anon key, que es pública.
--  Esta función es SECURITY DEFINER y devuelve ÚNICAMENTE los siete totales
--  que la landing ya enseña a todo el mundo. No expone ni una fila.
--
--  Para revertir:  drop function if exists public.estadisticas_publicas();
-- =====================================================================

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
set search_path = public
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

-- Sólo ejecución, y sólo para los roles de la API.
revoke all on function public.estadisticas_publicas() from public;
grant execute on function public.estadisticas_publicas() to anon, authenticated;

-- Comprobación: debe devolver una fila con los totales.
-- select * from public.estadisticas_publicas();
