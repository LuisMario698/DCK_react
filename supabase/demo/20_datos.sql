-- ============================================================================
-- Demo · Datos de ejemplo
-- ----------------------------------------------------------------------------
-- TODO es inventado: embarcaciones, tripulantes, empresas, teléfonos y
-- cantidades no son de nadie real. Va SÓLO en el proyecto Supabase de la demo,
-- nunca en el de producción.
--
-- Se puede volver a correr cuando sea: borra los datos y siembra de nuevo
-- (las cuentas de la demo y sus perfiles se conservan). Las fechas salen
-- alrededor de hoy; para ponerla al día otro día sin volver a sembrar:
--     select public.demo_poner_al_dia();
-- ============================================================================

-- Seguro: sólo corre en la base de la demostración (nunca en producción, donde borraría datos reales)
do $$
begin
    if to_regprocedure('public.es_base_demo()') is null and to_regprocedure('public.demo_poner_al_dia()') is null then
        raise exception 'Esta no es la base de la demostración. Este archivo sólo va en el proyecto Supabase de la demo (ver supabase/demo/README.md).';
    end if;
end $$;

-- ---------------------------------------------------------------------------
-- 0. Sin disparadores mientras se siembra (avisos y auditoría se escriben a
--    mano, con las horas correctas) y limpieza
-- ---------------------------------------------------------------------------
do $$
declare t record;
begin
    for t in select tablename from pg_tables where schemaname = 'public' loop
        execute format('alter table public.%I disable trigger user', t.tablename);
    end loop;
end $$;

truncate public.recolecciones, public.notificaciones, public.mensajes, public.solicitudes_recoleccion,
         public.pagos_suscripcion, public.suscripciones, public.planes, public.inventario_residuos,
         public.invitaciones, public.manifiestos_residuos, public.manifiestos_no_firmados,
         public.manifiestos, public.manifiesto_basuron, public.bitacora, public.buques,
         public.personas, public.tipos_persona, public.configuracion_sistema, public.audit_log
    restart identity;

delete from public.asociaciones_recolectoras;
alter sequence public.asociaciones_recolectoras_id_seq restart with 1;
alter sequence public.recolecciones_folio_seq restart with 1;

-- ---------------------------------------------------------------------------
-- 1. Configuración (la de la migración del superadmin)
-- ---------------------------------------------------------------------------
insert into public.configuracion_sistema (clave, valor, descripcion) values
    ('mantenimiento', '{"activo": false, "mensaje": ""}',
     'Cierra los paneles a todos excepto a los superadministradores'),
    ('aviso_global', '{"activo": false, "mensaje": "", "tipo": "info"}',
     'Banner visible en los paneles de administrador y recolector'),
    ('suscripciones', '{"obligatorias": false, "dias_prueba": 30}',
     'Si son obligatorias, una asociación sin suscripción vigente no puede crear solicitudes');

-- ---------------------------------------------------------------------------
-- 2. Personas y embarcaciones
-- ---------------------------------------------------------------------------
-- ids 1, 2 y 3 (el truncate de arriba reinicia los contadores)
insert into public.tipos_persona (nombre_tipo, descripcion) values
    ('Motorista', 'Entrega los residuos y firma el manifiesto por la embarcación'),
    ('Cocinero', 'Responsable de la basura de la cocina a bordo'),
    ('Responsable de Líquidos', 'Entrega el aceite usado y los filtros');

-- ids 1–14 motoristas, 15–26 cocineros, 27–30 responsables de líquidos
insert into public.personas (nombre, tipo_persona_id, info_contacto, registro_completo, created_at)
select p.nombre, p.tipo, '638 ' || (110 + p.n * 7) || ' ' || lpad(((p.n * 4813) % 10000)::text, 4, '0'), true,
       now() - make_interval(days => (400 - p.n * 9)::int)
from (
    select n, nombre, case when n <= 14 then 1 when n <= 26 then 2 else 3 end as tipo
    from unnest(array[
        'Ramón Esquer Valenzuela', 'Jesús Manuel Cota Ruiz', 'Francisco Javier Lugo Peña',
        'Héctor Alonso Valdez Ríos', 'Luis Alberto Ochoa Félix', 'José Ángel Moreno Castro',
        'Manuel de Jesús Ibarra Soto', 'Martín Gerardo Espinoza Leyva', 'Arturo Quiñónez Bustamante',
        'Rafael Enrique Duarte Murillo', 'Gilberto Navarro Zazueta', 'Óscar Iván Salazar Robles',
        'Juan Carlos Meza Acosta', 'Rogelio Tapia Encinas',
        'María de los Ángeles Félix Cota', 'Pedro Antonio Ruiz Lugo', 'Ana Karen Castro Ibarra',
        'Saúl Ernesto Leyva Duarte', 'Rosa Elena Murillo Tapia', 'Iván Alejandro Soto Navarro',
        'Guadalupe Zazueta Peña', 'Ernesto Valenzuela Meza', 'Claudia Ivette Acosta Ríos',
        'Abraham Encinas Ochoa', 'Norma Alicia Robles Espinoza', 'Joel Bustamante Salazar',
        'Armando Quintero Lizárraga', 'Sergio Arvizu Gámez', 'Patricia Moreno Lugo', 'Daniel Vázquez Corral'
    ]) with ordinality as x(nombre, n)
) p
order by p.n;

-- ids 1–14 activas, 15 en mantenimiento, 16 inactiva
insert into public.buques (nombre_buque, tipo_buque, propietario_id, fecha_registro, matricula, puerto_base,
                           capacidad_toneladas, estado, registro_completo, created_at)
select b.nombre,
       case when b.n % 3 = 0 then 'Barco escamero' else 'Barco camaronero' end,
       null,
       public.hoy_local() - (900 - b.n * 37)::int,
       'PP-' || (1040 + b.n * 13),
       'Puerto Peñasco',
       18 + (b.n * 7) % 40,
       case b.n when 15 then 'En Mantenimiento' when 16 then 'Inactivo' else 'Activo' end,
       true,
       now() - make_interval(days => (900 - b.n * 37)::int)
from unnest(array[
    'Don Chuy', 'La Güera II', 'Mar de Cortés', 'Estrella del Golfo', 'Doña Lupita', 'San Judas Tadeo',
    'El Pelícano', 'Tiburón III', 'Brisa Marina', 'Rey del Mar', 'La Sirena', 'Cachorón', 'Santa Rosalía',
    'Peñasco I', 'Corvina', 'El Faro'
]) with ordinality as b(nombre, n)
order by b.n;

-- ---------------------------------------------------------------------------
-- 3. Manifiestos de los últimos seis meses (más en temporada de camarón,
--    de septiembre a marzo) y su basura al basurón
-- ---------------------------------------------------------------------------
do $$
declare
    hoy    date := public.hoy_local();
    d      int;
    k      int;
    cuantos int;
    fecha  date;
    m_id   bigint;
    hora   time;
    ts     timestamptz;
    buque  int;
begin
    perform setseed(0.2026);
    for d in reverse 179..0 loop
        fecha := hoy - d;
        cuantos := case
            when d = 0 then 2
            when d = 1 then 2
            when extract(month from fecha) in (9, 10, 11, 12, 1, 2, 3) then (random() < 0.62)::int + (random() < 0.38)::int
            else (random() < 0.45)::int
        end;

        for k in 1..cuantos loop
            buque := 1 + floor(random() * 14)::int;
            hora := time '07:40' + make_interval(mins => floor(random() * 480)::int);
            ts := (fecha + hora) at time zone 'America/Hermosillo';
            -- Hoy: que ya hayan pasado
            if d = 0 then ts := now() - make_interval(mins => 35 + k * 95); end if;

            insert into public.manifiestos (numero_manifiesto, fecha_emision, buque_id, responsable_principal_id,
                                            responsable_secundario_id, responsable_liquidos_id,
                                            estado_digitalizacion, fecha_digitalizacion, observaciones,
                                            created_at, updated_at)
            values ('MAN' || to_char(fecha, 'DDMMYYYY') || lpad(k::text, 3, '0'), fecha, buque,
                    buque,                                                     -- su motorista
                    case when random() < 0.85 then 15 + floor(random() * 12)::int end,
                    case when random() < 0.40 then 27 + floor(random() * 4)::int end,
                    'completado', fecha,
                    case when random() < 0.12 then 'Tambos de aceite sellados y etiquetados.' end,
                    ts, ts)
            returning id into m_id;

            insert into public.manifiestos_residuos (manifiesto_id, aceite_usado, filtros_aceite, filtros_diesel,
                                                     filtros_aire, basura, created_at, updated_at)
            values (m_id,
                    round((20 + random() * 180)::numeric / 5) * 5,
                    floor(random() * 7)::int,
                    floor(random() * 5)::int,
                    floor(random() * 3)::int,
                    round((25 + random() * 210)::numeric),
                    ts, ts);
        end loop;

        -- Basurón: cada tres días (y hoy) la basura del muelle va al relleno sanitario
        if d % 3 = 0 then
            buque := 1 + floor(random() * 14)::int;
            hora := time '09:00' + make_interval(mins => floor(random() * 300)::int);
            ts := case when d = 0 then now() - interval '25 minutes'
                       else (fecha + hora + interval '30 minutes') at time zone 'America/Hermosillo' end;
            insert into public.manifiesto_basuron (fecha, peso_entrada, peso_salida, buque_id, observaciones,
                                                   hora_entrada, hora_salida, nombre_usuario, recibimos_de,
                                                   direccion, recibido_por, created_at, updated_at)
            select fecha, e.entrada, e.entrada - e.deposito,
                   case when random() < 0.7 then buque end,
                   '',
                   (ts at time zone 'America/Hermosillo')::time - interval '30 minutes',
                   (ts at time zone 'America/Hermosillo')::time - interval '5 minutes',
                   'Centro de acopio',
                   (select nombre from public.personas where id = buque),
                   'Muelle pesquero, Puerto Peñasco, Son.',
                   'Martín Ochoa Leyva',
                   ts, ts
              from (select round((2800 + random() * 900)::numeric) as entrada,
                           round((180 + random() * 270)::numeric) as deposito) e;
        end if;
    end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Empresas recolectoras, planes y suscripciones
-- ---------------------------------------------------------------------------
insert into public.asociaciones_recolectoras (nombre_asociacion, tipo_asociacion, contacto_asociacion, email, telefono,
                                              direccion, certificaciones, especialidad, estado, rfc, descripcion,
                                              tipos_residuo, created_at, updated_at) values
    ('Recicladora Mar Bermejo', 'Empresa', 'Karla Verdugo Mendívil', 'contacto@marbermejo.demo', '638 120 4410',
     'Calle Pescadores 112, Puerto Peñasco, Son.', '{"Registro ambiental estatal"}', '{"Aceite usado","Plástico","Cartón"}',
     'Activo', 'RMB200315AB1', 'Recolecta aceite usado, plástico y cartón de la flota pesquera para reciclarlos.',
     '{aceite,plastico,carton,vidrio}', now() - interval '200 days', now() - interval '200 days'),
    ('Aceites Limpios del Desierto', 'Empresa', 'Rubén Gastélum Araiza', 'ventas@aceiteslimpios.demo', '638 131 8820',
     'Carretera a Sonoyta km 4, Puerto Peñasco, Son.', '{"Autorización SEMARNAT de manejo de residuos peligrosos"}',
     '{"Aceite usado","Filtros"}', 'Activo', 'ALD180902QX7', 'Regenera aceite lubricante usado y recicla filtros.',
     '{aceite,filtros}', now() - interval '180 days', now() - interval '180 days'),
    ('Chatarrera El Ancla', 'Empresa', 'Francisco Lizárraga Toledo', 'elancla@chatarra.demo', '638 144 2075',
     'Av. Constitución 845, Puerto Peñasco, Son.', '{}', '{"Chatarra metálica"}', 'Activo', 'CEA150611LM3',
     'Compra y recicla chatarra metálica de embarcaciones.',
     '{chatarra}', now() - interval '150 days', now() - interval '150 days'),
    ('Colectivo Playa Limpia A.C.', 'Asociación civil', 'Mariela Rentería Fimbres', 'hola@playalimpia.demo',
     '638 109 3346', 'Malecón Kino s/n, Puerto Peñasco, Son.', '{}', '{"Plástico","Orgánico"}', 'Inactivo', null,
     'Voluntarios que limpian playas y reciclan plástico.',
     '{plastico,organico}', now() - interval '120 days', now() - interval '60 days');

insert into public.planes (nombre, descripcion, precio_mensual, precio_anual, limite_usuarios, caracteristicas, activo, orden) values
    ('Básico', 'Para empresas que recolectan una o dos veces al mes', 450, 4500, 3,
     '{"Solicitudes de recolección","Historial y comprobantes","Mensajes con el centro de acopio"}', true, 1),
    ('Profesional', 'Para empresas que recolectan cada semana', 900, 9000, 10,
     '{"Todo lo del plan Básico","Reporte de impacto","Constancia anual"}', true, 2);

insert into public.suscripciones (asociacion_id, plan_id, estado, ciclo, precio, fecha_inicio, vence_el, notas) values
    (1, 2, 'activa', 'mensual', 900, public.hoy_local() - 120, public.hoy_local() + 58, null),
    (2, 1, 'activa', 'mensual', 450, public.hoy_local() - 90, public.hoy_local() + 26, null),
    (3, 1, 'prueba', 'mensual', 0, public.hoy_local() - 20, public.hoy_local() + 10, 'Periodo de prueba');

insert into public.pagos_suscripcion (suscripcion_id, monto, fecha_pago, metodo, referencia, cubre_hasta, created_at)
select 1, 900, public.hoy_local() - 120 + n * 30, 'transferencia', 'SPEI ' || (48210 + n * 77),
       public.hoy_local() - 120 + (n + 1) * 30 + 28, now() - make_interval(days => 120 - n * 30)
  from generate_series(0, 3) n
union all
select 2, 450, public.hoy_local() - 90 + n * 30, 'deposito', 'Depósito ' || (1102 + n), public.hoy_local() - 90 + (n + 1) * 30 + 26,
       now() - make_interval(days => 90 - n * 30)
  from generate_series(0, 2) n;

-- ---------------------------------------------------------------------------
-- 5. Inventario publicado
-- ---------------------------------------------------------------------------
insert into public.inventario_residuos (tipo, cantidad, unidad, notas, publicado, created_at, updated_at) values
    ('aceite',   640, 'L',  'En tambos de 200 L, junto a la caseta.', true, now() - interval '170 days', now() - interval '2 days'),
    ('filtros',   85, 'pz', null, true, now() - interval '170 days', now() - interval '6 days'),
    ('plastico', 420, 'kg', 'Garrafas y bolsas, separado.', true, now() - interval '170 days', now() - interval '3 days'),
    ('carton',   180, 'kg', null, true, now() - interval '160 days', now() - interval '9 days'),
    ('chatarra', 950, 'kg', 'Cables, malla y piezas de motor.', true, now() - interval '150 days', now() - interval '12 days'),
    ('vidrio',    40, 'kg', null, true, now() - interval '100 days', now() - interval '20 days');

-- ---------------------------------------------------------------------------
-- 6. Solicitudes, recolecciones y sus avisos (con las horas que pondría la app)
-- ---------------------------------------------------------------------------
do $$
declare
    hoy  date := public.hoy_local();
    s    record;
    sid  bigint;
    creada     timestamptz;
    aprobada   timestamptz;
    resuelta   timestamptz;
    detalle    text;
    nombre     text;
    contacto   text;
begin
    for s in
        select * from (values
            -- asoc, tipo, unidad, pedida, aprobada, real, estado, días desde que se pidió, días hasta la fecha propuesta (negativo = ya pasó), mensaje, motivo
            (1, 'aceite',   'L',  400, 400, 385,  'completada', 38, -35, 'Pasamos con la pipa temprano.', null),
            (1, 'plastico', 'kg', 300, 300, 312,  'completada', 24, -21, 'Llevamos costales.', null),
            (1, 'carton',   'kg', 150, 150, 150,  'completada',  9,  -6, null, null),
            (1, 'vidrio',   'kg',  80, null, null, 'rechazada', 13, -10, null, 'Por ahora no hay vidrio suficiente. Vuelve a pedirlo en dos semanas.'),
            (1, 'aceite',   'L',  250, 250, null, 'aprobada',    3,   2, 'Vamos el jueves por la mañana con dos tambos.', null),
            (1, 'plastico', 'kg', 120, null, null, 'pendiente',  1,   5, null, null),
            (2, 'aceite',   'L',  500, 450, 450,  'completada', 30, -27, null, null),
            (2, 'filtros',  'pz',  60,  60,  58,  'completada', 16, -14, null, null),
            (2, 'aceite',   'L',  300, null, null, 'pendiente',  0,   3, '¿Podemos pasar el viernes?', null),
            (3, 'chatarra', 'kg', 800, 800, 760,  'completada', 45, -42, null, null),
            (3, 'chatarra', 'kg', 600, 600, null, 'aprobada',    4,   1, null, null),
            (4, 'plastico', 'kg',  80, null, null, 'cancelada', 50, -47, null, null)
        ) as v(asoc, tipo, unidad, pedida, aprob, real_, estado, dias_creada, dias_fecha, mensaje, motivo)
        order by (hoy + v.dias_fecha), v.asoc
    loop
        select nombre_asociacion, contacto_asociacion into nombre, contacto
          from public.asociaciones_recolectoras where id = s.asoc;

        creada := case when s.dias_creada = 0 then now() - interval '50 minutes'
                       else ((hoy - s.dias_creada) + time '10:15') at time zone 'America/Hermosillo' end;
        aprobada := creada + interval '1 day' - interval '75 minutes';
        resuelta := case s.estado
            when 'completada' then ((hoy + s.dias_fecha) + time '11:40') at time zone 'America/Hermosillo'
            when 'aprobada'   then aprobada
            when 'rechazada'  then aprobada
            when 'cancelada'  then creada + interval '1 day'
        end;

        insert into public.solicitudes_recoleccion (asociacion_id, tipo, cantidad_solicitada, cantidad_aprobada, unidad,
                                                    fecha_propuesta, mensaje, estado, motivo_rechazo, resuelta_at,
                                                    created_at, updated_at)
        values (s.asoc, s.tipo, s.pedida, s.aprob, s.unidad, hoy + s.dias_fecha, s.mensaje, s.estado, s.motivo,
                case when s.estado in ('completada', 'aprobada', 'rechazada') then resuelta end,
                creada, coalesce(resuelta, creada))
        returning id into sid;

        detalle := public.formato_cantidad(coalesce(s.aprob, s.pedida)) || ' ' || s.unidad
                   || ' de ' || lower(public.etiqueta_residuo(s.tipo));

        -- Aviso al centro de acopio: llegó la solicitud
        insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle, leida, created_at)
        values ('admin', s.asoc, 'nueva_solicitud', 'Nueva solicitud de ' || nombre,
                public.formato_cantidad(s.pedida) || ' ' || s.unidad || ' de ' || lower(public.etiqueta_residuo(s.tipo)),
                s.estado <> 'pendiente', creada);

        if s.estado in ('aprobada', 'completada') then
            insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle, leida, created_at)
            values ('recolector', s.asoc, 'aprobada', 'Solicitud aprobada',
                    detalle || ' · recolección el ' || to_char(hoy + s.dias_fecha, 'DD/MM/YYYY'),
                    s.estado = 'completada', aprobada);
        end if;

        if s.estado = 'rechazada' then
            insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle, leida, created_at)
            values ('recolector', s.asoc, 'rechazada', 'Solicitud rechazada', detalle || ' · ' || s.motivo, true, resuelta);
        end if;

        if s.estado = 'cancelada' then
            insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle, leida, created_at)
            values ('admin', s.asoc, 'cancelada', nombre || ' canceló su solicitud', detalle, true, resuelta);
        end if;

        if s.estado = 'completada' then
            insert into public.recolecciones (folio, solicitud_id, asociacion_id, tipo, cantidad, unidad, fecha,
                                              entregado_por, recibido_por, observaciones, created_at)
            values ('REC-' || to_char(hoy + s.dias_fecha, 'YYYY') || '-'
                        || lpad(nextval('public.recolecciones_folio_seq')::text, 5, '0'),
                    sid, s.asoc, s.tipo, s.real_, s.unidad, hoy + s.dias_fecha,
                    'Guadalupe Moreno Valle', contacto,
                    case when s.real_ <> s.aprob then 'La báscula marcó una cantidad distinta a la aprobada.' end,
                    resuelta);

            insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle, leida, created_at)
            values ('recolector', s.asoc, 'completada', 'Recolección completada',
                    public.formato_cantidad(s.real_) || ' ' || s.unidad || ' de ' || lower(public.etiqueta_residuo(s.tipo))
                        || ' · comprobante disponible en tu historial',
                    true, resuelta);
        end if;
    end loop;

    -- Residuo nuevo publicado hace dos días (sin leer en el portal)
    insert into public.notificaciones (destinatario, asociacion_id, tipo, titulo, detalle, leida, created_at)
    select 'recolector', a.id, 'nuevo_residuo', 'Nuevo residuo disponible',
           'Puerto Peñasco · 640 L de aceite usado', false, now() - interval '2 days'
      from public.asociaciones_recolectoras a
     where a.estado = 'Activo' and 'aceite' = any (a.tipos_residuo);
end $$;

-- ---------------------------------------------------------------------------
-- 7. Mensajes entre el centro de acopio y las empresas
-- ---------------------------------------------------------------------------
insert into public.mensajes (asociacion_id, autor_rol, texto, leido_at, created_at) values
    (1, 'recolector', 'Buenos días. ¿A qué hora podemos pasar por el aceite el jueves?',
        now() - interval '3 days' + interval '1 hour', now() - interval '3 days'),
    (1, 'admin', 'Buen día. De 9 a 13 h en el muelle 2. Traigan sus tambos, por favor.',
        now() - interval '2 days', now() - interval '3 days' + interval '2 hours'),
    (1, 'recolector', 'Perfecto, ahí estaremos. Gracias.',
        now() - interval '2 days' + interval '3 hours', now() - interval '2 days' + interval '1 hour'),
    (1, 'admin', 'Les apartamos también 120 kg de plástico limpio por si les interesa.',
        null, now() - interval '5 hours'),
    (2, 'recolector', 'Hola, ¿ya tienen listos los filtros de este mes?',
        null, now() - interval '40 minutes');

-- ---------------------------------------------------------------------------
-- 8. Cuentas de la demo
--    Se crean a mano en Authentication → Users (ver README). Si se crean
--    después de correr este archivo, las invitaciones les dan su rol solas;
--    si ya existían, demo_configurar_cuentas() se lo pone.
-- ---------------------------------------------------------------------------
insert into public.invitaciones (email, rol, asociacion_id) values
    ('puerto@simar.demo', 'admin', null),
    ('empresa@simar.demo', 'recolector', 1);

create or replace function public.demo_configurar_cuentas(
    p_puerto  text default 'puerto@simar.demo',
    p_empresa text default 'empresa@simar.demo'
)
returns text
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_puerto  int;
    v_empresa int;
begin
    update public.profiles
       set rol = 'admin', asociacion_id = null, es_superadmin = false, suspendido_at = null,
           full_name = 'Centro de acopio (demostración)'
     where lower(email) = lower(p_puerto);
    get diagnostics v_puerto = row_count;

    update public.profiles
       set rol = 'recolector', es_superadmin = false, suspendido_at = null,
           asociacion_id = (select id from public.asociaciones_recolectoras
                             where nombre_asociacion = 'Recicladora Mar Bermejo'),
           full_name = 'Karla Verdugo (demostración)'
     where lower(email) = lower(p_empresa);
    get diagnostics v_empresa = row_count;

    -- Ya no hacen falta las invitaciones de las cuentas que existen
    update public.invitaciones set aceptada_at = now()
     where aceptada_at is null
       and lower(email) in (select lower(email) from public.profiles where lower(email) in (lower(p_puerto), lower(p_empresa)));

    return format('Cuenta del puerto (%s): %s · Cuenta de la empresa (%s): %s',
                  p_puerto, case when v_puerto = 1 then 'lista' else 'falta crearla' end,
                  p_empresa, case when v_empresa = 1 then 'lista' else 'falta crearla' end);
end;
$$;
revoke all on function public.demo_configurar_cuentas(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Ponerla al día: recorre todas las fechas para que lo más nuevo sea de hoy
-- ---------------------------------------------------------------------------
create or replace function public.demo_poner_al_dia()
returns text
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_dias int;
    v_int  interval;
    t      record;
begin
    select public.hoy_local() - max(fecha_emision) into v_dias from public.manifiestos;
    if coalesce(v_dias, 0) <= 0 then
        return 'La demo ya está al día';
    end if;
    v_int := make_interval(days => v_dias);

    for t in select tablename from pg_tables where schemaname = 'public' loop
        execute format('alter table public.%I disable trigger user', t.tablename);
    end loop;

    update public.manifiestos set fecha_emision = fecha_emision + v_dias, fecha_digitalizacion = fecha_digitalizacion + v_dias,
           created_at = created_at + v_int, updated_at = updated_at + v_int;
    update public.manifiestos_residuos set created_at = created_at + v_int, updated_at = updated_at + v_int;
    update public.manifiesto_basuron set fecha = fecha + v_dias, created_at = created_at + v_int, updated_at = updated_at + v_int;
    update public.buques set fecha_registro = fecha_registro + v_dias, created_at = created_at + v_int, updated_at = updated_at + v_int;
    update public.personas set created_at = created_at + v_int, updated_at = updated_at + v_int;
    update public.asociaciones_recolectoras set created_at = created_at + v_int, updated_at = updated_at + v_int;
    update public.solicitudes_recoleccion set fecha_propuesta = fecha_propuesta + v_dias, resuelta_at = resuelta_at + v_int,
           created_at = created_at + v_int, updated_at = updated_at + v_int;
    update public.recolecciones set fecha = fecha + v_dias, created_at = created_at + v_int;
    update public.notificaciones set created_at = created_at + v_int;
    update public.mensajes set created_at = created_at + v_int, leido_at = leido_at + v_int;
    update public.inventario_residuos set created_at = created_at + v_int, updated_at = updated_at + v_int;
    update public.suscripciones set fecha_inicio = fecha_inicio + v_dias, vence_el = vence_el + v_dias,
           created_at = created_at + v_int, updated_at = updated_at + v_int;
    update public.pagos_suscripcion set fecha_pago = fecha_pago + v_dias, cubre_hasta = cubre_hasta + v_dias,
           created_at = created_at + v_int;

    for t in select tablename from pg_tables where schemaname = 'public' loop
        execute format('alter table public.%I enable trigger user', t.tablename);
    end loop;

    return format('Listo: se recorrieron %s días', v_dias);
end;
$$;
revoke all on function public.demo_poner_al_dia() from public, anon, authenticated;

-- Todos los días a las 00:05 de Puerto Peñasco (07:05 UTC), si el proyecto tiene pg_cron
do $$
begin
    create extension if not exists pg_cron;
    perform cron.schedule('simar-demo-al-dia', '5 7 * * *', 'select public.demo_poner_al_dia()');
exception when others then
    raise notice 'pg_cron no está disponible: corre "select public.demo_poner_al_dia();" la mañana de la presentación';
end $$;

-- ---------------------------------------------------------------------------
-- 10. De vuelta los disparadores y las cuentas (si ya existen)
-- ---------------------------------------------------------------------------
do $$
declare t record;
begin
    for t in select tablename from pg_tables where schemaname = 'public' loop
        execute format('alter table public.%I enable trigger user', t.tablename);
    end loop;
end $$;

select public.demo_configurar_cuentas();
