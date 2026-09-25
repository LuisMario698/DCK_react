-- Prueba de extremo a extremo del módulo de asociaciones + RLS por rol.
-- Se ejecuta contra un Postgres LOCAL desechable, nunca contra producción:
--
--   docker run -d --name simar-pgtest -e POSTGRES_PASSWORD=x postgres:16-alpine
--   for f in supabase/tests/00_stubs_supabase.sql supabase/migrations/*.sql supabase/tests/10_escenario_fase1.sql; do
--     docker exec -i simar-pgtest psql -U postgres -v ON_ERROR_STOP=1 < "$f"; done
--   docker rm -f simar-pgtest
--
-- Todas las líneas deben decir "OK bloqueado" (ninguna "FALLA").

\set QUIET on
\pset footer off
create or replace function pg_temp.como(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false) $$;
create or replace function pg_temp.espera_error(q text, etiqueta text) returns text language plpgsql as $$
begin
  execute q;
  return 'FALLA (no bloqueó): ' || etiqueta;
exception when others then
  return 'OK bloqueado: ' || etiqueta || ' → ' || sqlerrm;
end $$;

\echo '--- perfil backfill (usuario existente = admin)'
select email, rol from profiles;

\echo '--- admin invita a empresa@eco.mx a EcoRecicla (1)'
set role authenticated; select pg_temp.como('11111111-1111-1111-1111-111111111111');
select invitar_usuario('empresa@eco.mx', 'recolector', 1) as resultado;
reset role;

\echo '--- registros: empresa invitada, empresa de Verde Costa (invitada después) e intruso'
insert into auth.users (id, email) values
  ('22222222-2222-2222-2222-222222222222', 'Empresa@Eco.mx'),
  ('33333333-3333-3333-3333-333333333333', 'verde@costa.mx'),
  ('44444444-4444-4444-4444-444444444444', 'intruso@x.com');
select email, rol, asociacion_id from profiles order by email;

\echo '--- admin vincula a verde@costa.mx (ya registrado) → acceso inmediato'
set role authenticated; select pg_temp.como('11111111-1111-1111-1111-111111111111');
select invitar_usuario('verde@costa.mx', 'recolector', 2) as resultado;
\echo '--- admin publica inventario'
insert into inventario_residuos (tipo, cantidad, unidad) values ('plastico', 500, 'kg'), ('aceite', 300, 'L');
insert into inventario_residuos (tipo, cantidad, unidad, publicado) values ('vidrio', 80, 'kg', false);
reset role;
select email, rol, asociacion_id from profiles where email = 'verde@costa.mx';
select destinatario, asociacion_id, tipo, detalle from notificaciones order by id;

\echo '--- RECOLECTOR (EcoRecicla)'
set role authenticated; select pg_temp.como('22222222-2222-2222-2222-222222222222');
select 'manifiestos visibles' as prueba, count(*) from manifiestos;
select pg_temp.espera_error($$insert into manifiestos (numero_manifiesto) values ('X')$$, 'insertar manifiesto');
select 'asociaciones visibles' as prueba, string_agg(nombre_asociacion, ',') from asociaciones_recolectoras;
select 'inventario visible' as prueba, string_agg(tipo || ':' || cantidad, ', ') from inventario_residuos;
select 'perfiles visibles' as prueba, count(*) from profiles;
select pg_temp.espera_error($$update profiles set rol = 'admin' where id = auth.uid()$$, 'auto-promoverse a admin');
select pg_temp.espera_error($$update profiles set email = 'otro@x.com' where id = auth.uid()$$, 'cambiar su correo de perfil');
with c as (update asociaciones_recolectoras set estado = 'Suspendido' where id = 1 returning 1)
select case when count(*) = 0 then 'OK bloqueado: editar su asociación directamente (0 filas afectadas)'
            else 'FALLA (no bloqueó): editar su asociación directamente' end from c;
select pg_temp.espera_error($$select crear_solicitud('plastico', 600, current_date, null)$$, 'pedir más de lo disponible');
select pg_temp.espera_error($$select crear_solicitud('vidrio', 10, current_date, null)$$, 'pedir residuo no publicado');
select pg_temp.espera_error($$select crear_solicitud('plastico', 10, current_date - 3, null)$$, 'fecha pasada');
select pg_temp.espera_error($$select aprobar_solicitud(1, null)$$, 'aprobar como recolector');
select id, estado, cantidad_solicitada from crear_solicitud('plastico', 300, hoy_local() + 2, 'Pasamos el lunes');
select id, estado from crear_solicitud('aceite', 50, hoy_local() + 1, null);
insert into mensajes (asociacion_id, texto) values (2, 'Hola, intento escribir en otra conversación');
select 'mensaje forzado a su asociación' as prueba, asociacion_id, autor_rol from mensajes;
select pg_temp.espera_error($$insert into solicitudes_recoleccion (asociacion_id, tipo, cantidad_solicitada, unidad, fecha_propuesta) values (1,'plastico',1,'kg',current_date)$$, 'insertar solicitud saltándose la RPC');
reset role;

\echo '--- RECOLECTOR (Verde Costa) no ve lo de EcoRecicla'
set role authenticated; select pg_temp.como('33333333-3333-3333-3333-333333333333');
select 'solicitudes ajenas visibles' as prueba, count(*) from solicitudes_recoleccion;
select 'mensajes ajenos visibles' as prueba, count(*) from mensajes;
select pg_temp.espera_error($$select cancelar_solicitud(1)$$, 'cancelar solicitud ajena');
reset role;

\echo '--- INTRUSO (sin invitación)'
set role authenticated; select pg_temp.como('44444444-4444-4444-4444-444444444444');
select 'rol' as prueba, get_my_role();
select 'asociaciones / inventario / manifiestos visibles' as prueba,
  (select count(*) from asociaciones_recolectoras), (select count(*) from inventario_residuos), (select count(*) from manifiestos);
select pg_temp.espera_error($$select crear_solicitud('plastico', 1, current_date, null)$$, 'crear solicitud');
select pg_temp.espera_error($$insert into mensajes (asociacion_id, texto) values (1, 'hola')$$, 'mandar mensaje');
reset role;

\echo '--- ADMIN aprueba 250 de 300 kg y completa con 280 kg reales; cancela la de aceite'
set role authenticated; select pg_temp.como('11111111-1111-1111-1111-111111111111');
select 'nuevas solicitudes (notif admin)' as prueba, count(*) from notificaciones where tipo = 'nueva_solicitud';
select id, estado, cantidad_aprobada from aprobar_solicitud(1, 250);
select 'plástico tras aprobar' as prueba, cantidad from inventario_residuos where tipo = 'plastico';
select pg_temp.espera_error($$select aprobar_solicitud(1, null)$$, 'aprobar dos veces');
select folio, cantidad, entregado_por, recibido_por from completar_solicitud(1, 280, 'Francisco', 'Operador Eco', null);
select 'plástico tras completar (500-250-30)' as prueba, cantidad from inventario_residuos where tipo = 'plastico';
select id, estado from aprobar_solicitud(2, null);
select id, estado from cancelar_solicitud(2);
select 'aceite tras aprobar y cancelar' as prueba, cantidad from inventario_residuos where tipo = 'aceite';
select marcar_mensajes_leidos(1);
select 'mensajes leídos' as prueba, count(*) from mensajes where leido_at is not null;
reset role;

\echo '--- Notificaciones que ve EcoRecicla'
set role authenticated; select pg_temp.como('22222222-2222-2222-2222-222222222222');
select tipo, titulo, detalle from notificaciones order by id;
select marcar_notificaciones_leidas(null);
select 'no leídas tras marcar' as prueba, count(*) from notificaciones where not leida;
select folio, cantidad from recolecciones;
reset role;

\echo '--- Storage: comprobantes'
insert into storage.objects (bucket_id, name) values ('recolecciones_pdf', '1/REC-1.pdf'), ('recolecciones_pdf', '2/REC-2.pdf');
set role authenticated; select pg_temp.como('22222222-2222-2222-2222-222222222222');
select 'PDFs visibles para EcoRecicla' as prueba, string_agg(name, ',') from storage.objects;
select pg_temp.espera_error($$insert into storage.objects (bucket_id, name) values ('recolecciones_pdf', '1/falso.pdf')$$, 'subir comprobante como recolector');
reset role;

\echo '--- Auditoría'
select tabla, operacion, count(*) from audit_log group by 1, 2 order by 1, 2;
