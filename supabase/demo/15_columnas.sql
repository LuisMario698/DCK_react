-- ============================================================================
-- Demo · Columnas que faltan en el volcado
-- ----------------------------------------------------------------------------
-- estructura_completa.sql (pg_dump viejo) no trae dos columnas que el proyecto
-- real sí tiene en `manifiesto_basuron`: `estado` y `numero_ticket`. Sin ellas
-- el reporte del mes (Estadísticas) no se puede generar.
--
-- Los tickets llevan el formato del proyecto real (TKT-AAAAMMDD-000123) y los
-- pone demo_tickets_basuron(): la llaman la siembra (20_datos.sql) y
-- demo_poner_al_dia() al correr las fechas (ahí los disparadores van apagados).
--
-- Idempotente. En una demo ya armada: corre este archivo y luego 20_datos.sql.
-- ============================================================================

-- Seguro: sólo corre en la base de la demostración (en producción reescribiría los tickets reales)
do $$
begin
    if to_regprocedure('public.es_base_demo()') is null and to_regprocedure('public.demo_poner_al_dia()') is null then
        raise exception 'Esta no es la base de la demostración. Este archivo sólo va en el proyecto Supabase de la demo (ver supabase/demo/README.md).';
    end if;
end $$;

alter table public.manifiesto_basuron add column if not exists estado text default 'En Proceso';
alter table public.manifiesto_basuron add column if not exists numero_ticket text;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'manifiesto_basuron_estado_check') then
        alter table public.manifiesto_basuron
            add constraint manifiesto_basuron_estado_check check (estado in ('En Proceso', 'Completado', 'Cancelado'));
    end if;
end $$;

create unique index if not exists manifiesto_basuron_numero_ticket_key on public.manifiesto_basuron (numero_ticket);

-- Los recibos de ejemplo: cerrados y con el ticket de su fecha
create or replace function public.demo_tickets_basuron()
returns void
language sql
as $$
    update public.manifiesto_basuron
       set numero_ticket = 'TKT-' || to_char(fecha, 'YYYYMMDD') || '-' || lpad(id::text, 6, '0'),
           estado = 'Completado'
     where id is not null;
$$;
revoke all on function public.demo_tickets_basuron() from public, anon, authenticated;

