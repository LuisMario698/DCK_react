-- ============================================================================
-- SiMAR · Base de datos de la DEMOSTRACIÓN (archivo generado: no lo edites)
-- ----------------------------------------------------------------------------
-- Generado con: node supabase/demo/armar.mjs
-- Sólo para un proyecto Supabase NUEVO y vacío. Nunca en el de producción.
-- Pasos completos en supabase/demo/README.md.
-- ============================================================================

begin;

-- Seguro: sólo en un proyecto vacío. Si la base ya tiene tablas de SiMAR (la demo ya creada, o
-- peor, producción) no se toca nada.
do $$
begin
    if to_regclass('public.manifiestos') is not null then
        raise exception 'Esta base ya tiene las tablas de SiMAR: no se cambió nada. Si es la demo y ya corriste este archivo, ya está lista (para el candado nuevo corre sólo supabase/demo/30_candado.sql). Si es el proyecto de producción, no corras nada de supabase/demo.';
    end if;
end $$;

-- Marca de la base de la demo: 20_datos.sql y 30_candado.sql se niegan a correr donde no está
create or replace function public.es_base_demo() returns boolean language sql immutable as 'select true';

-- >>>>> estructura_completa.sql (sin las tablas del POS ajeno)

SET statement_timeout = 0;

SET lock_timeout = 0;

SET idle_in_transaction_session_timeout = 0;

SET client_encoding = 'UTF8';

SET standard_conforming_strings = on;

SELECT pg_catalog.set_config('search_path', '', false);

SET check_function_bodies = false;

SET xmloption = content;

SET client_min_messages = warning;

SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "public";

ALTER SCHEMA "public" OWNER TO "pg_database_owner";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE OR REPLACE FUNCTION "public"."audit_trigger_fn"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO audit_log (tabla, operacion, registro_id, datos_ant, datos_nue)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
            ELSE NEW.id::TEXT
        END,
        CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."audit_trigger_fn"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_chart_data"("p_year" integer, "p_month" integer DEFAULT NULL::integer) RETURNS TABLE("label" "text", "aceite" numeric, "basura" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Si se especifica mes, mostrar días
  IF p_month IS NOT NULL THEN
    RETURN QUERY
    WITH combined_data AS (
      SELECT
        m.fecha_emision::DATE as fecha,
        COALESCE(mr.aceite_usado, 0) as aceite,
        COALESCE(mr.basura, 0) as basura
      FROM manifiestos m
      JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
      WHERE EXTRACT(YEAR FROM m.fecha_emision) = p_year
        AND EXTRACT(MONTH FROM m.fecha_emision) = p_month
      
      UNION ALL
      
      SELECT
        mb.fecha::DATE as fecha,
        0 as aceite,
        COALESCE(mb.total_depositado, 0) as basura
      FROM manifiesto_basuron mb
      WHERE EXTRACT(YEAR FROM mb.fecha) = p_year
        AND EXTRACT(MONTH FROM mb.fecha) = p_month
    )
    SELECT
      TO_CHAR(cd.fecha, 'DD') as label,
      SUM(cd.aceite) as aceite,
      SUM(cd.basura) as basura
    FROM combined_data cd
    GROUP BY 1
    ORDER BY 1;
    
  ELSE
    -- Si no se especifica mes, mostrar meses del año
    RETURN QUERY
    WITH combined_data AS (
      SELECT
        DATE_TRUNC('month', m.fecha_emision)::DATE as fecha,
        COALESCE(mr.aceite_usado, 0) as aceite,
        COALESCE(mr.basura, 0) as basura
      FROM manifiestos m
      JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
      WHERE EXTRACT(YEAR FROM m.fecha_emision) = p_year
      
      UNION ALL
      
      SELECT
        DATE_TRUNC('month', mb.fecha)::DATE as fecha,
        0 as aceite,
        COALESCE(mb.total_depositado, 0) as basura
      FROM manifiesto_basuron mb
      WHERE EXTRACT(YEAR FROM mb.fecha) = p_year
    )
    SELECT
      TO_CHAR(cd.fecha, 'MM') as label,
      SUM(cd.aceite) as aceite,
      SUM(cd.basura) as basura
    FROM combined_data cd
    GROUP BY 1
    ORDER BY 1;
  END IF;
END;
$$;

ALTER FUNCTION "public"."get_chart_data"("p_year" integer, "p_month" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_dashboard_kpis"() RETURNS TABLE("total_manifiestos" bigint, "manifiestos_pendientes" bigint, "total_buques" bigint, "buques_activos" bigint, "total_aceite" numeric, "total_basura" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  res_total_manifiestos BIGINT;
  res_manifiestos_pendientes BIGINT;
  res_total_buques BIGINT;
  res_buques_activos BIGINT;
  res_total_aceite NUMERIC;
  res_total_basura NUMERIC;
  
  -- Variables auxiliares para basurón
  basuron_count BIGINT;
  basuron_pendientes BIGINT;
  basuron_total_kg NUMERIC;
BEGIN
  -- Conteos Manifiestos (Aceite/Filtros)
  SELECT COUNT(*) INTO res_total_manifiestos FROM manifiestos;
  SELECT COUNT(*) INTO res_manifiestos_pendientes FROM manifiestos WHERE estado_digitalizacion = 'pendiente';
  
  -- Conteos Basurón
  SELECT COUNT(*) INTO basuron_count FROM manifiesto_basuron;
  -- Asumimos que si no tiene fecha de salida o peso salida es pendiente, o usamos estado si existe
  SELECT COUNT(*) INTO basuron_pendientes FROM manifiesto_basuron WHERE peso_salida IS NULL OR peso_salida = 0;
  SELECT COALESCE(SUM(total_depositado), 0) INTO basuron_total_kg FROM manifiesto_basuron;
  -- Conteos Buques
  SELECT COUNT(*) INTO res_total_buques FROM buques;
  SELECT COUNT(*) INTO res_buques_activos FROM buques WHERE estado = 'Activo';
  
  -- Sumas de residuos (Manifiestos)
  SELECT 
    COALESCE(SUM(aceite_usado), 0),
    COALESCE(SUM(basura), 0)
  INTO res_total_aceite, res_total_basura
  FROM manifiestos_residuos;
  -- Combinar resultados
  RETURN QUERY SELECT 
    (res_total_manifiestos + basuron_count) as total_manifiestos, 
    (res_manifiestos_pendientes + basuron_pendientes) as manifiestos_pendientes, 
    res_total_buques, 
    res_buques_activos, 
    res_total_aceite, 
    (res_total_basura + basuron_total_kg) as total_basura;
END;
$$;

ALTER FUNCTION "public"."get_dashboard_kpis"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_monthly_waste_stats"("months_limit" integer DEFAULT 6) RETURNS TABLE("mes" "text", "aceite" numeric, "basura" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH combined_data AS (
    -- Datos de Manifiestos (Aceite y Basura)
    SELECT
      DATE_TRUNC('month', m.fecha_emision)::DATE as fecha,
      COALESCE(mr.aceite_usado, 0) as aceite,
      COALESCE(mr.basura, 0) as basura
    FROM manifiestos m
    JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
    WHERE m.fecha_emision >= DATE_TRUNC('month', CURRENT_DATE - (months_limit || ' months')::INTERVAL)
    
    UNION ALL
    
    -- Datos de Basurón (Solo Basura)
    SELECT
      DATE_TRUNC('month', mb.fecha)::DATE as fecha,
      0 as aceite,
      COALESCE(mb.total_depositado, 0) as basura
    FROM manifiesto_basuron mb
    WHERE mb.fecha >= DATE_TRUNC('month', CURRENT_DATE - (months_limit || ' months')::INTERVAL)
  )
  SELECT
    TO_CHAR(cd.fecha, 'YYYY-MM') as mes,
    SUM(cd.aceite) as aceite,
    SUM(cd.basura) as basura
  FROM combined_data cd
  GROUP BY 1
  ORDER BY 1;
END;
$$;

ALTER FUNCTION "public"."get_monthly_waste_stats"("months_limit" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_reporte_detallado"("p_fecha_inicio" "date" DEFAULT NULL::"date", "p_fecha_fin" "date" DEFAULT NULL::"date", "p_buque_id" bigint DEFAULT NULL::bigint, "p_estado" "text" DEFAULT NULL::"text") RETURNS TABLE("fecha" "date", "folio" "text", "buque" "text", "tipo_residuo" "text", "cantidad" numeric, "unidad" "text", "estado" "text", "responsable" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY

  -- 1. Aceite Usado
  SELECT m.fecha_emision, m.numero_manifiesto, b.nombre_buque,
    'Aceite Usado'::TEXT, mr.aceite_usado, 'litros'::TEXT,
    m.estado_digitalizacion, COALESCE(p.nombre, 'No asignado')
  FROM manifiestos m
  JOIN buques b ON m.buque_id = b.id
  JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
  LEFT JOIN personas p ON m.responsable_principal_id = p.id
  WHERE mr.aceite_usado > 0
    AND (p_fecha_inicio IS NULL OR m.fecha_emision >= p_fecha_inicio)
    AND (p_fecha_fin   IS NULL OR m.fecha_emision <= p_fecha_fin)
    AND (p_buque_id    IS NULL OR m.buque_id = p_buque_id)
    AND (p_estado      IS NULL OR m.estado_digitalizacion = p_estado)

  UNION ALL

  -- 2. Filtros de Aceite
  SELECT m.fecha_emision, m.numero_manifiesto, b.nombre_buque,
    'Filtros Aceite'::TEXT, mr.filtros_aceite::NUMERIC, 'piezas'::TEXT,
    m.estado_digitalizacion, COALESCE(p.nombre, 'No asignado')
  FROM manifiestos m
  JOIN buques b ON m.buque_id = b.id
  JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
  LEFT JOIN personas p ON m.responsable_principal_id = p.id
  WHERE mr.filtros_aceite > 0
    AND (p_fecha_inicio IS NULL OR m.fecha_emision >= p_fecha_inicio)
    AND (p_fecha_fin   IS NULL OR m.fecha_emision <= p_fecha_fin)
    AND (p_buque_id    IS NULL OR m.buque_id = p_buque_id)
    AND (p_estado      IS NULL OR m.estado_digitalizacion = p_estado)

  UNION ALL

  -- 3. Filtros de Diesel
  SELECT m.fecha_emision, m.numero_manifiesto, b.nombre_buque,
    'Filtros Diesel'::TEXT, mr.filtros_diesel::NUMERIC, 'piezas'::TEXT,
    m.estado_digitalizacion, COALESCE(p.nombre, 'No asignado')
  FROM manifiestos m
  JOIN buques b ON m.buque_id = b.id
  JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
  LEFT JOIN personas p ON m.responsable_principal_id = p.id
  WHERE mr.filtros_diesel > 0
    AND (p_fecha_inicio IS NULL OR m.fecha_emision >= p_fecha_inicio)
    AND (p_fecha_fin   IS NULL OR m.fecha_emision <= p_fecha_fin)
    AND (p_buque_id    IS NULL OR m.buque_id = p_buque_id)
    AND (p_estado      IS NULL OR m.estado_digitalizacion = p_estado)

  UNION ALL

  -- 4. Filtros de Aire
  SELECT m.fecha_emision, m.numero_manifiesto, b.nombre_buque,
    'Filtros Aire'::TEXT, mr.filtros_aire::NUMERIC, 'piezas'::TEXT,
    m.estado_digitalizacion, COALESCE(p.nombre, 'No asignado')
  FROM manifiestos m
  JOIN buques b ON m.buque_id = b.id
  JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
  LEFT JOIN personas p ON m.responsable_principal_id = p.id
  WHERE mr.filtros_aire > 0
    AND (p_fecha_inicio IS NULL OR m.fecha_emision >= p_fecha_inicio)
    AND (p_fecha_fin   IS NULL OR m.fecha_emision <= p_fecha_fin)
    AND (p_buque_id    IS NULL OR m.buque_id = p_buque_id)
    AND (p_estado      IS NULL OR m.estado_digitalizacion = p_estado)

  UNION ALL

  -- 5. Basura General
  SELECT m.fecha_emision, m.numero_manifiesto, b.nombre_buque,
    'Basura General'::TEXT, mr.basura, 'kg'::TEXT,
    m.estado_digitalizacion, COALESCE(p.nombre, 'No asignado')
  FROM manifiestos m
  JOIN buques b ON m.buque_id = b.id
  JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
  LEFT JOIN personas p ON m.responsable_principal_id = p.id
  WHERE mr.basura > 0
    AND (p_fecha_inicio IS NULL OR m.fecha_emision >= p_fecha_inicio)
    AND (p_fecha_fin   IS NULL OR m.fecha_emision <= p_fecha_fin)
    AND (p_buque_id    IS NULL OR m.buque_id = p_buque_id)
    AND (p_estado      IS NULL OR m.estado_digitalizacion = p_estado)

  UNION ALL

  -- 6. Basurón (Tickets)
  SELECT mb.fecha, 'TICKET-' || mb.id::TEXT, b.nombre_buque,
    'Basura (Ticket)'::TEXT, mb.total_depositado, 'kg'::TEXT,
    CASE WHEN mb.peso_salida > 0 THEN 'completado' ELSE 'pendiente' END,
    COALESCE(mb.nombre_usuario, 'Sistema')
  FROM manifiesto_basuron mb
  JOIN buques b ON mb.buque_id = b.id
  WHERE mb.total_depositado > 0
    AND (p_fecha_inicio IS NULL OR mb.fecha >= p_fecha_inicio)
    AND (p_fecha_fin   IS NULL OR mb.fecha <= p_fecha_fin)
    AND (p_buque_id    IS NULL OR mb.buque_id = p_buque_id)
    AND (p_estado IS NULL OR
        (p_estado = 'completado' AND mb.peso_salida > 0) OR
        (p_estado = 'pendiente'  AND (mb.peso_salida IS NULL OR mb.peso_salida = 0)))

  ORDER BY 1 DESC;
END;
$$;

ALTER FUNCTION "public"."get_reporte_detallado"("p_fecha_inicio" "date", "p_fecha_fin" "date", "p_buque_id" bigint, "p_estado" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_top_buques_waste"("limit_count" integer DEFAULT 5) RETURNS TABLE("buque_id" bigint, "nombre_buque" "text", "total_kg" numeric, "cantidad_manifiestos" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH combined_waste AS (
    -- Manifiestos
    SELECT
      m.buque_id,
      (COALESCE(mr.aceite_usado, 0) + COALESCE(mr.basura, 0)) as kg,
      1 as count_op
    FROM manifiestos m
    JOIN manifiestos_residuos mr ON m.id = mr.manifiesto_id
    
    UNION ALL
    
    -- Basurón
    SELECT
      mb.buque_id,
      COALESCE(mb.total_depositado, 0) as kg,
      1 as count_op
    FROM manifiesto_basuron mb
  )
  SELECT
    b.id,
    b.nombre_buque,
    COALESCE(SUM(cw.kg), 0) as total_kg,
    COALESCE(SUM(cw.count_op), 0) as cantidad_manifiestos
  FROM buques b
  JOIN combined_waste cw ON b.id = cw.buque_id
  GROUP BY b.id, b.nombre_buque
  ORDER BY total_kg DESC
  LIMIT limit_count;
END;
$$;

ALTER FUNCTION "public"."get_top_buques_waste"("limit_count" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_buque_bitacora"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.bitacora(id_embarcacion, usuario_email, accion)
  VALUES(
    NEW.id, 
    auth.jwt() ->> 'email', 
    'Registro de nueva embarcación'
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."handle_new_buque_bitacora"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."registrar_bitacora_embarcacion"("id_embarcacion" integer, "usuario" "text", "accion" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.bitacora (id_embarcacion, usuario, accion, fecha_registro)
  VALUES (id_embarcacion, usuario, accion, NOW());
END;
$$;

ALTER FUNCTION "public"."registrar_bitacora_embarcacion"("id_embarcacion" integer, "usuario" "text", "accion" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_manifiesto_basuron_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_manifiesto_basuron_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_manifiestos_no_firmados_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_manifiestos_no_firmados_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_manifiestos_residuos_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_manifiestos_residuos_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_manifiestos_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_manifiestos_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."asociaciones_recolectoras" (
    "id" bigint NOT NULL,
    "nombre_asociacion" "text" NOT NULL,
    "tipo_asociacion" "text",
    "contacto_asociacion" "text",
    "email" "text",
    "telefono" "text",
    "direccion" "text",
    "certificaciones" "text"[],
    "especialidad" "text"[],
    "estado" "text" DEFAULT 'Activo'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "asociaciones_recolectoras_estado_check" CHECK (("estado" = ANY (ARRAY['Activo'::"text", 'Inactivo'::"text", 'Suspendido'::"text"])))
);

ALTER TABLE "public"."asociaciones_recolectoras" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."asociaciones_recolectoras_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."asociaciones_recolectoras_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."asociaciones_recolectoras_id_seq" OWNED BY "public"."asociaciones_recolectoras"."id";

CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" bigint NOT NULL,
    "tabla" "text" NOT NULL,
    "operacion" "text" NOT NULL,
    "registro_id" "text",
    "datos_ant" "jsonb",
    "datos_nue" "jsonb",
    "usuario_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "audit_log_operacion_check" CHECK (("operacion" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);

ALTER TABLE "public"."audit_log" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."audit_log_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."audit_log_id_seq" OWNED BY "public"."audit_log"."id";

CREATE TABLE IF NOT EXISTS "public"."backup_schedules" (
    "id" integer NOT NULL,
    "activo" boolean DEFAULT false,
    "frecuencia" "text" DEFAULT 'diario'::"text",
    "dia_semana" integer DEFAULT 1,
    "hora" "text" DEFAULT '02:00'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "backup_schedules_dia_semana_check" CHECK ((("dia_semana" >= 0) AND ("dia_semana" <= 6))),
    CONSTRAINT "backup_schedules_frecuencia_check" CHECK (("frecuencia" = ANY (ARRAY['diario'::"text", 'semanal'::"text"])))
);

ALTER TABLE "public"."backup_schedules" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."backup_schedules_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."backup_schedules_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."backup_schedules_id_seq" OWNED BY "public"."backup_schedules"."id";

CREATE TABLE IF NOT EXISTS "public"."backups" (
    "id" bigint NOT NULL,
    "nombre" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "tablas" "text"[],
    "storage_path" "text",
    "tamanio_kb" integer DEFAULT 0,
    "estado" "text" DEFAULT 'completado'::"text",
    "creado_por" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "backups_estado_check" CHECK (("estado" = ANY (ARRAY['completado'::"text", 'fallido'::"text", 'en_proceso'::"text"]))),
    CONSTRAINT "backups_tipo_check" CHECK (("tipo" = ANY (ARRAY['manual'::"text", 'automatico'::"text"])))
);

ALTER TABLE "public"."backups" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."backups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."backups_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."backups_id_seq" OWNED BY "public"."backups"."id";

CREATE TABLE IF NOT EXISTS "public"."bitacora" (
    "id" bigint NOT NULL,
    "fecha_registro" timestamp with time zone DEFAULT "now"(),
    "id_embarcacion" bigint,
    "usuario_email" "text",
    "accion" "text"
);

ALTER TABLE "public"."bitacora" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."bitacora_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."bitacora_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."bitacora_id_seq" OWNED BY "public"."bitacora"."id";

CREATE TABLE IF NOT EXISTS "public"."buques" (
    "id" bigint NOT NULL,
    "nombre_buque" "text" NOT NULL,
    "tipo_buque" "text",
    "propietario_id" bigint,
    "fecha_registro" "date" DEFAULT CURRENT_DATE,
    "matricula" "text",
    "puerto_base" "text",
    "capacidad_toneladas" numeric(10,2),
    "estado" "text" DEFAULT 'Activo'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "registro_completo" boolean DEFAULT true,
    CONSTRAINT "buques_estado_check" CHECK (("estado" = ANY (ARRAY['Activo'::"text", 'Inactivo'::"text", 'En Mantenimiento'::"text"])))
);

ALTER TABLE "public"."buques" OWNER TO "postgres";

COMMENT ON COLUMN "public"."buques"."registro_completo" IS 'Indica si el registro tiene todos los datos completos. FALSE = creado automáticamente desde manifiesto';

CREATE SEQUENCE IF NOT EXISTS "public"."buques_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."buques_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."buques_id_seq" OWNED BY "public"."buques"."id";

CREATE TABLE IF NOT EXISTS "public"."manifiesto_basuron" (
    "id" bigint NOT NULL,
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "peso_entrada" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "peso_salida" numeric(10,2) DEFAULT '0'::numeric,
    "total_depositado" numeric(10,2) GENERATED ALWAYS AS (("peso_entrada" - COALESCE("peso_salida", (0)::numeric))) STORED,
    "buque_id" bigint,
    "observaciones" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "hora_entrada" time without time zone,
    "hora_salida" time without time zone,
    "nombre_usuario" "text" DEFAULT ''::"text",
    "pdf_manifiesto_url" "text",
    "recibimos_de" "text",
    "direccion" "text",
    "recibido_por" "text",
    CONSTRAINT "manifiesto_basuron_peso_entrada_check" CHECK (("peso_entrada" >= (0)::numeric)),
    CONSTRAINT "manifiesto_basuron_peso_salida_check" CHECK (("peso_salida" >= (0)::numeric))
);

ALTER TABLE "public"."manifiesto_basuron" OWNER TO "postgres";

COMMENT ON COLUMN "public"."manifiesto_basuron"."pdf_manifiesto_url" IS 'URL del archivo PDF generado y almacenado en Storage';

COMMENT ON COLUMN "public"."manifiesto_basuron"."recibimos_de" IS 'Nombre de quien entrega el residuo (Texto manual)';

COMMENT ON COLUMN "public"."manifiesto_basuron"."direccion" IS 'Dirección de origen del residuo (Texto manual)';

COMMENT ON COLUMN "public"."manifiesto_basuron"."recibido_por" IS 'Nombre de la persona que recibe el residuo (Firma/Responsable)';

CREATE SEQUENCE IF NOT EXISTS "public"."manifiesto_basuron_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."manifiesto_basuron_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."manifiesto_basuron_id_seq" OWNED BY "public"."manifiesto_basuron"."id";

CREATE TABLE IF NOT EXISTS "public"."manifiestos" (
    "id" bigint NOT NULL,
    "numero_manifiesto" "text" NOT NULL,
    "fecha_emision" "date" DEFAULT CURRENT_DATE NOT NULL,
    "buque_id" bigint,
    "responsable_principal_id" bigint,
    "imagen_manifiesto_url" "text",
    "estado_digitalizacion" "text" DEFAULT 'pendiente'::"text",
    "digitalizador_id" bigint,
    "fecha_digitalizacion" "date",
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "responsable_secundario_id" bigint,
    "pdf_manifiesto_url" "text",
    "responsable_liquidos_id" bigint,
    CONSTRAINT "manifiestos_estado_digitalizacion_check1" CHECK (("estado_digitalizacion" = ANY (ARRAY['pendiente'::"text", 'en_proceso'::"text", 'completado'::"text"])))
);

ALTER TABLE "public"."manifiestos" OWNER TO "postgres";

COMMENT ON COLUMN "public"."manifiestos"."pdf_manifiesto_url" IS 'URL del archivo PDF generado y almacenado en el bucket manifiestos_pdf';

CREATE SEQUENCE IF NOT EXISTS "public"."manifiestos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."manifiestos_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."manifiestos_id_seq" OWNED BY "public"."manifiestos"."id";

CREATE TABLE IF NOT EXISTS "public"."manifiestos_no_firmados" (
    "id" bigint NOT NULL,
    "manifiesto_id" bigint NOT NULL,
    "nombre_archivo" "text" NOT NULL,
    "ruta_archivo" "text" NOT NULL,
    "url_descarga" "text",
    "numero_manifiesto" "text" NOT NULL,
    "fecha_generacion" timestamp with time zone DEFAULT "now"(),
    "estado" "text" DEFAULT 'pendiente'::"text",
    "descargado_en" timestamp with time zone,
    "descargado_por" "text",
    "firmado_en" timestamp with time zone,
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "manifiestos_no_firmados_estado_check" CHECK (("estado" = ANY (ARRAY['pendiente'::"text", 'descargado'::"text", 'firmado'::"text", 'cancelado'::"text"])))
);

ALTER TABLE "public"."manifiestos_no_firmados" OWNER TO "postgres";

COMMENT ON TABLE "public"."manifiestos_no_firmados" IS 'Almacena metadata de PDFs de manifiestos generados pero aún no firmados';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."id" IS 'Identificador único del registro';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."manifiesto_id" IS 'Referencia al manifiesto original en la tabla manifiestos';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."nombre_archivo" IS 'Nombre del archivo PDF generado';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."ruta_archivo" IS 'Ruta del archivo en el bucket de Supabase Storage';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."url_descarga" IS 'URL temporal para descargar el PDF';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."numero_manifiesto" IS 'Número del manifiesto para referencia rápida';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."fecha_generacion" IS 'Fecha y hora en que se generó el PDF';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."estado" IS 'Estado del documento: pendiente, descargado, firmado, cancelado';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."descargado_en" IS 'Timestamp de cuándo se descargó el documento';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."descargado_por" IS 'Usuario que descargó el documento';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."firmado_en" IS 'Timestamp de cuándo se marcó como firmado';

COMMENT ON COLUMN "public"."manifiestos_no_firmados"."observaciones" IS 'Notas adicionales sobre el documento';

CREATE SEQUENCE IF NOT EXISTS "public"."manifiestos_no_firmados_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."manifiestos_no_firmados_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."manifiestos_no_firmados_id_seq" OWNED BY "public"."manifiestos_no_firmados"."id";

CREATE TABLE IF NOT EXISTS "public"."manifiestos_residuos" (
    "id" bigint NOT NULL,
    "manifiesto_id" bigint NOT NULL,
    "aceite_usado" numeric(10,2) DEFAULT 0,
    "filtros_aceite" integer DEFAULT 0,
    "filtros_diesel" integer DEFAULT 0,
    "basura" numeric(10,2) DEFAULT 0,
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "filtros_aire" integer DEFAULT 0,
    CONSTRAINT "manifiestos_residuos_aceite_usado_check" CHECK (("aceite_usado" >= (0)::numeric)),
    CONSTRAINT "manifiestos_residuos_basura_check" CHECK (("basura" >= (0)::numeric)),
    CONSTRAINT "manifiestos_residuos_filtros_aceite_check" CHECK (("filtros_aceite" >= 0)),
    CONSTRAINT "manifiestos_residuos_filtros_diesel_check" CHECK (("filtros_diesel" >= 0))
);

ALTER TABLE "public"."manifiestos_residuos" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."manifiestos_residuos_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."manifiestos_residuos_id_seq1" OWNER TO "postgres";

ALTER SEQUENCE "public"."manifiestos_residuos_id_seq1" OWNED BY "public"."manifiestos_residuos"."id";

CREATE TABLE IF NOT EXISTS "public"."personas" (
    "id" bigint NOT NULL,
    "nombre" "text" NOT NULL,
    "tipo_persona_id" bigint,
    "info_contacto" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "registro_completo" boolean DEFAULT true
);

ALTER TABLE "public"."personas" OWNER TO "postgres";

COMMENT ON COLUMN "public"."personas"."registro_completo" IS 'Indica si el registro tiene todos los datos completos. FALSE = creado automáticamente desde manifiesto';

CREATE SEQUENCE IF NOT EXISTS "public"."personas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."personas_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."personas_id_seq" OWNED BY "public"."personas"."id";

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."tipos_persona" (
    "id" bigint NOT NULL,
    "nombre_tipo" "text" NOT NULL,
    "descripcion" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."tipos_persona" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."tipos_persona_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."tipos_persona_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."tipos_persona_id_seq" OWNED BY "public"."tipos_persona"."id";

ALTER TABLE ONLY "public"."asociaciones_recolectoras" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."asociaciones_recolectoras_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."audit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_log_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."backup_schedules" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."backup_schedules_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."backups" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."backups_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."bitacora" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bitacora_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."buques" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."buques_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."manifiesto_basuron" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."manifiesto_basuron_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."manifiestos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."manifiestos_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."manifiestos_no_firmados" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."manifiestos_no_firmados_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."manifiestos_residuos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."manifiestos_residuos_id_seq1"'::"regclass");

ALTER TABLE ONLY "public"."personas" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."personas_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."tipos_persona" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tipos_persona_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."asociaciones_recolectoras"
    ADD CONSTRAINT "asociaciones_recolectoras_nombre_asociacion_key" UNIQUE ("nombre_asociacion");

ALTER TABLE ONLY "public"."asociaciones_recolectoras"
    ADD CONSTRAINT "asociaciones_recolectoras_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."backup_schedules"
    ADD CONSTRAINT "backup_schedules_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."backups"
    ADD CONSTRAINT "backups_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bitacora"
    ADD CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."buques"
    ADD CONSTRAINT "buques_matricula_key" UNIQUE ("matricula");

ALTER TABLE ONLY "public"."buques"
    ADD CONSTRAINT "buques_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."manifiesto_basuron"
    ADD CONSTRAINT "manifiesto_basuron_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."manifiestos_no_firmados"
    ADD CONSTRAINT "manifiestos_no_firmados_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."manifiestos"
    ADD CONSTRAINT "manifiestos_numero_manifiesto_key" UNIQUE ("numero_manifiesto");

ALTER TABLE ONLY "public"."manifiestos"
    ADD CONSTRAINT "manifiestos_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."manifiestos_residuos"
    ADD CONSTRAINT "manifiestos_residuos_manifiesto_id_key" UNIQUE ("manifiesto_id");

ALTER TABLE ONLY "public"."manifiestos_residuos"
    ADD CONSTRAINT "manifiestos_residuos_pkey1" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tipos_persona"
    ADD CONSTRAINT "tipos_persona_nombre_tipo_key" UNIQUE ("nombre_tipo");

ALTER TABLE ONLY "public"."tipos_persona"
    ADD CONSTRAINT "tipos_persona_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."buques"
    ADD CONSTRAINT "unique_nombre_buque" UNIQUE ("nombre_buque");

CREATE INDEX "idx_asociaciones_estado" ON "public"."asociaciones_recolectoras" USING "btree" ("estado");

CREATE INDEX "idx_asociaciones_tipo" ON "public"."asociaciones_recolectoras" USING "btree" ("tipo_asociacion");

CREATE INDEX "idx_audit_log_created" ON "public"."audit_log" USING "btree" ("created_at" DESC);

CREATE INDEX "idx_audit_log_operacion" ON "public"."audit_log" USING "btree" ("operacion");

CREATE INDEX "idx_audit_log_tabla" ON "public"."audit_log" USING "btree" ("tabla");

CREATE INDEX "idx_backups_created" ON "public"."backups" USING "btree" ("created_at" DESC);

CREATE INDEX "idx_buques_estado" ON "public"."buques" USING "btree" ("estado");

CREATE INDEX "idx_buques_propietario" ON "public"."buques" USING "btree" ("propietario_id");

CREATE INDEX "idx_buques_tipo" ON "public"."buques" USING "btree" ("tipo_buque");

CREATE INDEX "idx_manifiesto_basuron_buque" ON "public"."manifiesto_basuron" USING "btree" ("buque_id");

CREATE INDEX "idx_manifiesto_basuron_fecha" ON "public"."manifiesto_basuron" USING "btree" ("fecha");

CREATE INDEX "idx_manifiestos_buque" ON "public"."manifiestos" USING "btree" ("buque_id");

CREATE INDEX "idx_manifiestos_estado" ON "public"."manifiestos" USING "btree" ("estado_digitalizacion");

CREATE INDEX "idx_manifiestos_no_firmados_estado" ON "public"."manifiestos_no_firmados" USING "btree" ("estado");

CREATE INDEX "idx_manifiestos_no_firmados_fecha_generacion" ON "public"."manifiestos_no_firmados" USING "btree" ("fecha_generacion" DESC);

CREATE INDEX "idx_manifiestos_no_firmados_manifiesto_id" ON "public"."manifiestos_no_firmados" USING "btree" ("manifiesto_id");

CREATE INDEX "idx_manifiestos_no_firmados_numero" ON "public"."manifiestos_no_firmados" USING "btree" ("numero_manifiesto");

CREATE INDEX "idx_manifiestos_numero" ON "public"."manifiestos" USING "btree" ("numero_manifiesto");

CREATE INDEX "idx_manifiestos_responsable_principal" ON "public"."manifiestos" USING "btree" ("responsable_principal_id");

CREATE INDEX "idx_manifiestos_responsable_secundario" ON "public"."manifiestos" USING "btree" ("responsable_secundario_id");

CREATE INDEX "idx_personas_nombre" ON "public"."personas" USING "btree" ("nombre");

CREATE INDEX "idx_personas_tipo" ON "public"."personas" USING "btree" ("tipo_persona_id");

CREATE OR REPLACE TRIGGER "on_buque_created" AFTER INSERT ON "public"."buques" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_buque_bitacora"();

CREATE OR REPLACE TRIGGER "trg_audit_asociaciones" AFTER INSERT OR DELETE OR UPDATE ON "public"."asociaciones_recolectoras" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_fn"();

CREATE OR REPLACE TRIGGER "trg_audit_buques" AFTER INSERT OR DELETE OR UPDATE ON "public"."buques" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_fn"();

CREATE OR REPLACE TRIGGER "trg_audit_manifiesto_basuron" AFTER INSERT OR DELETE OR UPDATE ON "public"."manifiesto_basuron" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_fn"();

CREATE OR REPLACE TRIGGER "trg_audit_manifiestos" AFTER INSERT OR DELETE OR UPDATE ON "public"."manifiestos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_fn"();

CREATE OR REPLACE TRIGGER "trg_audit_manifiestos_residuos" AFTER INSERT OR DELETE OR UPDATE ON "public"."manifiestos_residuos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_fn"();

CREATE OR REPLACE TRIGGER "trg_audit_personas" AFTER INSERT OR DELETE OR UPDATE ON "public"."personas" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_fn"();

CREATE OR REPLACE TRIGGER "trg_audit_tipos_persona" AFTER INSERT OR DELETE OR UPDATE ON "public"."tipos_persona" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger_fn"();

CREATE OR REPLACE TRIGGER "trigger_update_manifiesto_basuron_updated_at" BEFORE UPDATE ON "public"."manifiesto_basuron" FOR EACH ROW EXECUTE FUNCTION "public"."update_manifiesto_basuron_updated_at"();

CREATE OR REPLACE TRIGGER "trigger_update_manifiestos_no_firmados_updated_at" BEFORE UPDATE ON "public"."manifiestos_no_firmados" FOR EACH ROW EXECUTE FUNCTION "public"."update_manifiestos_no_firmados_updated_at"();

CREATE OR REPLACE TRIGGER "trigger_update_manifiestos_residuos_updated_at" BEFORE UPDATE ON "public"."manifiestos_residuos" FOR EACH ROW EXECUTE FUNCTION "public"."update_manifiestos_residuos_updated_at"();

CREATE OR REPLACE TRIGGER "trigger_update_manifiestos_updated_at" BEFORE UPDATE ON "public"."manifiestos" FOR EACH ROW EXECUTE FUNCTION "public"."update_manifiestos_updated_at"();

CREATE OR REPLACE TRIGGER "update_asociaciones_recolectoras_updated_at" BEFORE UPDATE ON "public"."asociaciones_recolectoras" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_buques_updated_at" BEFORE UPDATE ON "public"."buques" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_personas_updated_at" BEFORE UPDATE ON "public"."personas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_tipos_persona_updated_at" BEFORE UPDATE ON "public"."tipos_persona" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

ALTER TABLE ONLY "public"."buques"
    ADD CONSTRAINT "buques_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "public"."personas"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."manifiestos_no_firmados"
    ADD CONSTRAINT "fk_manifiesto" FOREIGN KEY ("manifiesto_id") REFERENCES "public"."manifiestos"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."manifiesto_basuron"
    ADD CONSTRAINT "manifiesto_basuron_buque_id_fkey" FOREIGN KEY ("buque_id") REFERENCES "public"."buques"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."manifiestos"
    ADD CONSTRAINT "manifiestos_buque_id_fkey" FOREIGN KEY ("buque_id") REFERENCES "public"."buques"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."manifiestos"
    ADD CONSTRAINT "manifiestos_generador_id_fkey1" FOREIGN KEY ("responsable_principal_id") REFERENCES "public"."personas"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."manifiestos_residuos"
    ADD CONSTRAINT "manifiestos_residuos_manifiesto_id_fkey1" FOREIGN KEY ("manifiesto_id") REFERENCES "public"."manifiestos"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."manifiestos"
    ADD CONSTRAINT "manifiestos_responsable_liquidos_id_fkey" FOREIGN KEY ("responsable_liquidos_id") REFERENCES "public"."personas"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."manifiestos"
    ADD CONSTRAINT "manifiestos_responsable_secundario_id_fkey" FOREIGN KEY ("responsable_secundario_id") REFERENCES "public"."personas"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_tipo_persona_id_fkey" FOREIGN KEY ("tipo_persona_id") REFERENCES "public"."tipos_persona"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE POLICY "Enable all for manifiesto_basuron" ON "public"."manifiesto_basuron" USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualización a autenticados" ON "public"."manifiesto_basuron" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "Permitir borrado a autenticados" ON "public"."manifiesto_basuron" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Permitir inserción a autenticados" ON "public"."manifiesto_basuron" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Permitir inserción a usuarios autenticados" ON "public"."bitacora" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Permitir lectura a todos" ON "public"."manifiesto_basuron" FOR SELECT USING (true);

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON "public"."asociaciones_recolectoras" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON "public"."buques" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON "public"."personas" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON "public"."tipos_persona" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));

CREATE POLICY "Permitir todo en manifiestos" ON "public"."manifiestos" USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo en manifiestos_residuos" ON "public"."manifiestos_residuos" USING (true) WITH CHECK (true);

CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));

CREATE POLICY "Usuarios autenticados pueden actualizar manifiestos no firmados" ON "public"."manifiestos_no_firmados" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden crear manifiestos no firmados" ON "public"."manifiestos_no_firmados" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar manifiestos no firmados" ON "public"."manifiestos_no_firmados" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Usuarios autenticados pueden leer manifiestos no firmados" ON "public"."manifiestos_no_firmados" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "allow_all_authenticated" ON "public"."audit_log" TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_authenticated" ON "public"."backup_schedules" TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_authenticated" ON "public"."backups" TO "authenticated" USING (true) WITH CHECK (true);

ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."backup_schedules" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."backups" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."audit_trigger_fn"() TO "anon";

GRANT ALL ON FUNCTION "public"."audit_trigger_fn"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."audit_trigger_fn"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_chart_data"("p_year" integer, "p_month" integer) TO "anon";

GRANT ALL ON FUNCTION "public"."get_chart_data"("p_year" integer, "p_month" integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_chart_data"("p_year" integer, "p_month" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_dashboard_kpis"() TO "anon";

GRANT ALL ON FUNCTION "public"."get_dashboard_kpis"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_dashboard_kpis"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_monthly_waste_stats"("months_limit" integer) TO "anon";

GRANT ALL ON FUNCTION "public"."get_monthly_waste_stats"("months_limit" integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_monthly_waste_stats"("months_limit" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_reporte_detallado"("p_fecha_inicio" "date", "p_fecha_fin" "date", "p_buque_id" bigint, "p_estado" "text") TO "anon";

GRANT ALL ON FUNCTION "public"."get_reporte_detallado"("p_fecha_inicio" "date", "p_fecha_fin" "date", "p_buque_id" bigint, "p_estado" "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_reporte_detallado"("p_fecha_inicio" "date", "p_fecha_fin" "date", "p_buque_id" bigint, "p_estado" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_top_buques_waste"("limit_count" integer) TO "anon";

GRANT ALL ON FUNCTION "public"."get_top_buques_waste"("limit_count" integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_top_buques_waste"("limit_count" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_buque_bitacora"() TO "anon";

GRANT ALL ON FUNCTION "public"."handle_new_buque_bitacora"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."handle_new_buque_bitacora"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."registrar_bitacora_embarcacion"("id_embarcacion" integer, "usuario" "text", "accion" "text") TO "anon";

GRANT ALL ON FUNCTION "public"."registrar_bitacora_embarcacion"("id_embarcacion" integer, "usuario" "text", "accion" "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."registrar_bitacora_embarcacion"("id_embarcacion" integer, "usuario" "text", "accion" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";

GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_manifiesto_basuron_updated_at"() TO "anon";

GRANT ALL ON FUNCTION "public"."update_manifiesto_basuron_updated_at"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_manifiesto_basuron_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_manifiestos_no_firmados_updated_at"() TO "anon";

GRANT ALL ON FUNCTION "public"."update_manifiestos_no_firmados_updated_at"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_manifiestos_no_firmados_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_manifiestos_residuos_updated_at"() TO "anon";

GRANT ALL ON FUNCTION "public"."update_manifiestos_residuos_updated_at"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_manifiestos_residuos_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_manifiestos_updated_at"() TO "anon";

GRANT ALL ON FUNCTION "public"."update_manifiestos_updated_at"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_manifiestos_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT ALL ON TABLE "public"."asociaciones_recolectoras" TO "anon";

GRANT ALL ON TABLE "public"."asociaciones_recolectoras" TO "authenticated";

GRANT ALL ON TABLE "public"."asociaciones_recolectoras" TO "service_role";

GRANT ALL ON SEQUENCE "public"."asociaciones_recolectoras_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."asociaciones_recolectoras_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."asociaciones_recolectoras_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."audit_log" TO "anon";

GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";

GRANT ALL ON TABLE "public"."audit_log" TO "service_role";

GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."backup_schedules" TO "anon";

GRANT ALL ON TABLE "public"."backup_schedules" TO "authenticated";

GRANT ALL ON TABLE "public"."backup_schedules" TO "service_role";

GRANT ALL ON SEQUENCE "public"."backup_schedules_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."backup_schedules_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."backup_schedules_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."backups" TO "anon";

GRANT ALL ON TABLE "public"."backups" TO "authenticated";

GRANT ALL ON TABLE "public"."backups" TO "service_role";

GRANT ALL ON SEQUENCE "public"."backups_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."backups_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."backups_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."bitacora" TO "anon";

GRANT ALL ON TABLE "public"."bitacora" TO "authenticated";

GRANT ALL ON TABLE "public"."bitacora" TO "service_role";

GRANT ALL ON SEQUENCE "public"."bitacora_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."bitacora_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."bitacora_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."buques" TO "anon";

GRANT ALL ON TABLE "public"."buques" TO "authenticated";

GRANT ALL ON TABLE "public"."buques" TO "service_role";

GRANT ALL ON SEQUENCE "public"."buques_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."buques_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."buques_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."manifiesto_basuron" TO "anon";

GRANT ALL ON TABLE "public"."manifiesto_basuron" TO "authenticated";

GRANT ALL ON TABLE "public"."manifiesto_basuron" TO "service_role";

GRANT ALL ON SEQUENCE "public"."manifiesto_basuron_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."manifiesto_basuron_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."manifiesto_basuron_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."manifiestos" TO "anon";

GRANT ALL ON TABLE "public"."manifiestos" TO "authenticated";

GRANT ALL ON TABLE "public"."manifiestos" TO "service_role";

GRANT ALL ON SEQUENCE "public"."manifiestos_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."manifiestos_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."manifiestos_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."manifiestos_no_firmados" TO "anon";

GRANT ALL ON TABLE "public"."manifiestos_no_firmados" TO "authenticated";

GRANT ALL ON TABLE "public"."manifiestos_no_firmados" TO "service_role";

GRANT ALL ON SEQUENCE "public"."manifiestos_no_firmados_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."manifiestos_no_firmados_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."manifiestos_no_firmados_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."manifiestos_residuos" TO "anon";

GRANT ALL ON TABLE "public"."manifiestos_residuos" TO "authenticated";

GRANT ALL ON TABLE "public"."manifiestos_residuos" TO "service_role";

GRANT ALL ON SEQUENCE "public"."manifiestos_residuos_id_seq1" TO "anon";

GRANT ALL ON SEQUENCE "public"."manifiestos_residuos_id_seq1" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."manifiestos_residuos_id_seq1" TO "service_role";

GRANT ALL ON TABLE "public"."personas" TO "anon";

GRANT ALL ON TABLE "public"."personas" TO "authenticated";

GRANT ALL ON TABLE "public"."personas" TO "service_role";

GRANT ALL ON SEQUENCE "public"."personas_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."personas_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."personas_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";

GRANT ALL ON TABLE "public"."profiles" TO "authenticated";

GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."tipos_persona" TO "anon";

GRANT ALL ON TABLE "public"."tipos_persona" TO "authenticated";

GRANT ALL ON TABLE "public"."tipos_persona" TO "service_role";

GRANT ALL ON SEQUENCE "public"."tipos_persona_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."tipos_persona_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."tipos_persona_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

-- El volcado deja la ruta de búsqueda vacía, sin revisar cuerpos de funciones y sin RLS en la sesión
select pg_catalog.set_config('search_path', 'public, extensions', false);
set check_function_bodies = true;
reset row_security;

-- >>>>> supabase/migrations/20260923000001_roles_y_rls.sql

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

-- >>>>> supabase/migrations/20260923000002_modulo_asociaciones.sql

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

-- >>>>> supabase/migrations/20260924000003_endurecer_funciones.sql

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

-- >>>>> supabase/migrations/20260924000004_estadisticas_publicas.sql

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

-- >>>>> supabase/migrations/20260925000005_panel_superadmin.sql

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

-- >>>>> supabase/migrations/20260926000006_superadmin_como_asociacion.sql

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

-- >>>>> supabase/demo/10_almacenamiento.sql

-- ============================================================================
-- Demo · Almacenamiento
-- ----------------------------------------------------------------------------
-- Los buckets que la app lee. En la demo nadie sube archivos (ver
-- 30_candado.sql): los PDF del manifiesto y del basurón se generan en el
-- navegador al descargarlos. Sólo hace falta subir a mano el logo de SEMARNAT
-- a `images/logoSemarnat.png` (lo usan los PDF; ver supabase/demo/README.md).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('manifiestos_img', 'manifiestos_img', true),
       ('manifiestos_pdf', 'manifiestos_pdf', true),
       ('manifiestos_basuron_pdf', 'manifiestos_basuron_pdf', true),
       ('manifiestos-no-firmados', 'manifiestos-no-firmados', false),
       ('images', 'images', true)
on conflict (id) do update set public = excluded.public;

-- Lectura de los buckets públicos para cualquiera (las URL públicas ya lo
-- permiten; esto cubre también las descargas con el cliente de Supabase).
drop policy if exists demo_lectura_publica on storage.objects;
create policy demo_lectura_publica on storage.objects
    for select to anon, authenticated
    using (bucket_id = any (array['manifiestos_img', 'manifiestos_pdf', 'manifiestos_basuron_pdf', 'images']));

-- >>>>> supabase/demo/20_datos.sql

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

-- >>>>> supabase/demo/30_candado.sql

-- ============================================================================
-- Demo · Candado: la demo es de sólo lectura
-- ----------------------------------------------------------------------------
-- Cualquier escritura que llegue por la app (rol anon o authenticated, también
-- dentro de las RPC) se rechaza con un aviso amable. El editor SQL (postgres),
-- la creación de cuentas desde el panel de Supabase y pg_cron no llevan JWT,
-- así que sí pueden sembrar y poner al día los datos.
--
-- La app, en modo demostración, ya ataja las escrituras antes de mandarlas
-- (lib/demo/supabaseDemo.ts); esto es la segunda llave, por si alguien llama a
-- la API a mano con la cuenta de la demo.
--
-- Si después se agrega una tabla, vuelve a correr este archivo.
-- ============================================================================

-- Seguro: sólo corre en la base de la demostración (nunca en producción, donde borraría datos reales)
do $$
begin
    if to_regprocedure('public.es_base_demo()') is null and to_regprocedure('public.demo_poner_al_dia()') is null then
        raise exception 'Esta no es la base de la demostración. Este archivo sólo va en el proyecto Supabase de la demo (ver supabase/demo/README.md).';
    end if;
end $$;

-- RLS en todas las tablas. El volcado y las migraciones dejan `profiles` con sus políticas pero sin
-- encender RLS (en producción está encendido): sin esto, cualquier sesión leería todos los perfiles.
do $$
declare t record;
begin
    for t in
        select c.relname
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
    loop
        execute format('alter table public.%I enable row level security', t.relname);
    end loop;
end $$;

create or replace function public.demo_solo_lectura()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    if coalesce(auth.role(), '') in ('authenticated', 'anon') then
        raise exception 'En la demostración no se guardan cambios'
            using hint = 'modo_demo';
    end if;
    return null;
end;
$$;

do $$
declare t record;
begin
    for t in
        select c.relname
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind in ('r', 'p')
    loop
        execute format('drop trigger if exists zz_demo_solo_lectura on public.%I', t.relname);
        execute format(
            'create trigger zz_demo_solo_lectura before insert or update or delete or truncate on public.%I '
            'for each statement execute function public.demo_solo_lectura()', t.relname);
    end loop;
end $$;

-- Archivos: nadie sube, cambia ni borra (las políticas restrictivas se suman a las demás con "y")
drop policy if exists demo_sin_subir on storage.objects;
create policy demo_sin_subir on storage.objects as restrictive
    for insert to anon, authenticated with check (false);

drop policy if exists demo_sin_cambiar on storage.objects;
create policy demo_sin_cambiar on storage.objects as restrictive
    for update to anon, authenticated using (false);

drop policy if exists demo_sin_borrar on storage.objects;
create policy demo_sin_borrar on storage.objects as restrictive
    for delete to anon, authenticated using (false);

commit;
