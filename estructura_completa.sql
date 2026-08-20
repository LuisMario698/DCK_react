


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


CREATE OR REPLACE FUNCTION "public"."generar_numero_ticket"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.numero_ticket IS NULL THEN
        NEW.numero_ticket := 'TKT-' || TO_CHAR(NEW.fecha, 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generar_numero_ticket"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role
  FROM public.users
  WHERE auth_id = auth.uid()
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT tenant_id
  FROM public.users
  WHERE auth_id = auth.uid()
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_tenant_id"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."process_credit_payment"("p_sucursal_id" "uuid", "p_cliente_id" "uuid", "p_monto_abono" numeric, "p_metodo_pago_id" "uuid", "p_creditos_ids" "uuid"[] DEFAULT NULL::"uuid"[], "p_observaciones" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_remanente NUMERIC := p_monto_abono;
    v_amort_item RECORD;
    v_monto_aplicar NUMERIC;
    v_total_pagado NUMERIC := 0;
    v_folio_pago TEXT;
    v_saldo_pendiente_item NUMERIC;
    v_credito_id UUID;
BEGIN
    -- 1. Validation
    IF p_monto_abono <= 0 THEN
        RAISE EXCEPTION 'El monto del abono debe ser mayor a 0';
    END IF;

    -- Generate Payment Folio
    v_folio_pago := 'PAGO-' || to_char(NOW(), 'YYMMDD') || '-' || floor(random() * 9000 + 1000)::text;

    -- 2. Waterfall Payment Logic
    -- Loop through amortization items ordered by due date (Oldest First)
    -- If specific credits selected, filter by them.
    FOR v_amort_item IN 
        SELECT ta.*, c.folio as folio_credito
        FROM tabla_amortizacion ta
        JOIN creditos c ON c.id = ta.credito_id
        WHERE c.cliente_id = p_cliente_id
          AND ta.estado != 'pagado'
          AND (p_creditos_ids IS NULL OR c.id = ANY(p_creditos_ids))
        ORDER BY ta.fecha_vencimiento ASC, ta.id ASC
    LOOP
        EXIT WHEN v_remanente <= 0.01; -- Stop if money runs out (allow minimal float tolerance)

        -- Calculate how much is still owed on this specific installment
        v_saldo_pendiente_item := v_amort_item.monto_pago_esperado - COALESCE(v_amort_item.monto_pagado, 0);
        
        IF v_saldo_pendiente_item > 0 THEN
            -- Determine how much we can pay on this item
            IF v_remanente >= v_saldo_pendiente_item THEN
                v_monto_aplicar := v_saldo_pendiente_item;
            ELSE
                v_monto_aplicar := v_remanente;
            END IF;

            -- Update Amortization Table
            UPDATE tabla_amortizacion
            SET monto_pagado = COALESCE(monto_pagado, 0) + v_monto_aplicar,
                estado = CASE 
                            WHEN (monto_pago_esperado - (COALESCE(monto_pagado, 0) + v_monto_aplicar)) <= 0.01 
                            THEN 'pagado' 
                            ELSE 'pendiente' -- Could be 'parcial' if we added that status, but 'pendiente' works
                         END
            WHERE id = v_amort_item.id;

            -- Update Parent Credit Balance
            UPDATE creditos
            SET saldo_pendiente = saldo_pendiente - v_monto_aplicar,
                estado = CASE WHEN (saldo_pendiente - v_monto_aplicar) <= 0.01 THEN 'pagado' ELSE 'activo' END
            WHERE id = v_amort_item.credito_id;

            v_remanente := v_remanente - v_monto_aplicar;
            v_total_pagado := v_total_pagado + v_monto_aplicar;
        END IF;
    END LOOP;
    
    -- 3. Log the Transaction (Single entry for the whole payment)
    INSERT INTO estado_cuenta_clientes (
        cliente_id, credito_id, tipo_movimiento, descripcion, monto, observaciones
    ) VALUES (
        p_cliente_id, NULL, 'abono', 
        'Abono Global / Múltiple ' || v_folio_pago, 
        -v_total_pagado,
        p_observaciones
    );

    -- 4. Update Client Total Credit Used
    -- Recalculate from scratch is safest
    UPDATE clientes 
    SET credito_utilizado = (
        SELECT COALESCE(SUM(saldo_pendiente), 0) 
        FROM creditos 
        WHERE cliente_id = p_cliente_id AND estado = 'activo'
    )
    WHERE id = p_cliente_id;

    -- Return Result
    RETURN jsonb_build_object(
        'success', true,
        'folio_pago', v_folio_pago,
        'total_pagado', v_total_pagado,
        'remanente', v_remanente
    );
END;
$$;


ALTER FUNCTION "public"."process_credit_payment"("p_sucursal_id" "uuid", "p_cliente_id" "uuid", "p_monto_abono" numeric, "p_metodo_pago_id" "uuid", "p_creditos_ids" "uuid"[], "p_observaciones" "text") OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "name" "text" NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "order_items_subtotal_check" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "order_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "tax" numeric(10,2) DEFAULT 0 NOT NULL,
    "tip" numeric(10,2) DEFAULT 0 NOT NULL,
    "total" numeric(10,2) DEFAULT 0 NOT NULL,
    "payment_method" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "orders_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'card'::"text", 'transfer'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'preparing'::"text", 'ready'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "orders_subtotal_check" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "orders_tax_check" CHECK (("tax" >= (0)::numeric)),
    CONSTRAINT "orders_tip_check" CHECK (("tip" >= (0)::numeric)),
    CONSTRAINT "orders_total_check" CHECK (("total" >= (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "image_url" "text",
    "sku" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "products_price_check" CHECK (("price" >= (0)::numeric))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "primary_color" "text" DEFAULT '#6F4E37'::"text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "auth_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'cashier'::"text", 'waiter'::"text", 'kitchen'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tipos_persona"
    ADD CONSTRAINT "tipos_persona_nombre_tipo_key" UNIQUE ("nombre_tipo");



ALTER TABLE ONLY "public"."tipos_persona"
    ADD CONSTRAINT "tipos_persona_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buques"
    ADD CONSTRAINT "unique_nombre_buque" UNIQUE ("nombre_buque");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_tenant_id_email_key" UNIQUE ("tenant_id", "email");



CREATE INDEX "idx_asociaciones_estado" ON "public"."asociaciones_recolectoras" USING "btree" ("estado");



CREATE INDEX "idx_asociaciones_tipo" ON "public"."asociaciones_recolectoras" USING "btree" ("tipo_asociacion");



CREATE INDEX "idx_audit_log_created" ON "public"."audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_log_operacion" ON "public"."audit_log" USING "btree" ("operacion");



CREATE INDEX "idx_audit_log_tabla" ON "public"."audit_log" USING "btree" ("tabla");



CREATE INDEX "idx_backups_created" ON "public"."backups" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_buques_estado" ON "public"."buques" USING "btree" ("estado");



CREATE INDEX "idx_buques_propietario" ON "public"."buques" USING "btree" ("propietario_id");



CREATE INDEX "idx_buques_tipo" ON "public"."buques" USING "btree" ("tipo_buque");



CREATE INDEX "idx_categories_tenant_id" ON "public"."categories" USING "btree" ("tenant_id");



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



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_tenant_id" ON "public"."order_items" USING "btree" ("tenant_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_tenant_id" ON "public"."orders" USING "btree" ("tenant_id");



CREATE INDEX "idx_personas_nombre" ON "public"."personas" USING "btree" ("nombre");



CREATE INDEX "idx_personas_tipo" ON "public"."personas" USING "btree" ("tipo_persona_id");



CREATE INDEX "idx_products_category_id" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_products_tenant_id" ON "public"."products" USING "btree" ("tenant_id");



CREATE INDEX "idx_users_tenant_id" ON "public"."users" USING "btree" ("tenant_id");



CREATE OR REPLACE TRIGGER "on_buque_created" AFTER INSERT ON "public"."buques" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_buque_bitacora"();



CREATE OR REPLACE TRIGGER "set_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



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



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_tipo_persona_id_fkey" FOREIGN KEY ("tipo_persona_id") REFERENCES "public"."tipos_persona"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



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


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_delete_admin" ON "public"."categories" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "categories_insert_admin" ON "public"."categories" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "categories_select_tenant" ON "public"."categories" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "categories_update_admin" ON "public"."categories" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_delete_admin" ON "public"."order_items" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "order_items_insert_tenant" ON "public"."order_items" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "order_items_select_tenant" ON "public"."order_items" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "order_items_update_tenant" ON "public"."order_items" FOR UPDATE USING (("tenant_id" = "public"."get_user_tenant_id"()));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_delete_admin" ON "public"."orders" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "orders_insert_tenant" ON "public"."orders" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "orders_select_tenant" ON "public"."orders" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "orders_update_tenant" ON "public"."orders" FOR UPDATE USING (("tenant_id" = "public"."get_user_tenant_id"()));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_delete_admin" ON "public"."products" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "products_insert_admin" ON "public"."products" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "products_select_tenant" ON "public"."products" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "products_update_admin" ON "public"."products" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenants_select_own" ON "public"."tenants" FOR SELECT USING (("id" = "public"."get_user_tenant_id"()));



CREATE POLICY "tenants_update_admin" ON "public"."tenants" FOR UPDATE USING ((("id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_delete_admin" ON "public"."users" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "users_insert_admin" ON "public"."users" FOR INSERT WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



CREATE POLICY "users_select_same_tenant" ON "public"."users" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "users_update_admin" ON "public"."users" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND ("public"."get_user_role"() = 'admin'::"text")));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_trigger_fn"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_trigger_fn"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_trigger_fn"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generar_numero_ticket"() TO "anon";
GRANT ALL ON FUNCTION "public"."generar_numero_ticket"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generar_numero_ticket"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_buque_bitacora"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_buque_bitacora"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_buque_bitacora"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_credit_payment"("p_sucursal_id" "uuid", "p_cliente_id" "uuid", "p_monto_abono" numeric, "p_metodo_pago_id" "uuid", "p_creditos_ids" "uuid"[], "p_observaciones" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_credit_payment"("p_sucursal_id" "uuid", "p_cliente_id" "uuid", "p_monto_abono" numeric, "p_metodo_pago_id" "uuid", "p_creditos_ids" "uuid"[], "p_observaciones" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_credit_payment"("p_sucursal_id" "uuid", "p_cliente_id" "uuid", "p_monto_abono" numeric, "p_metodo_pago_id" "uuid", "p_creditos_ids" "uuid"[], "p_observaciones" "text") TO "service_role";



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



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



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



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."personas" TO "anon";
GRANT ALL ON TABLE "public"."personas" TO "authenticated";
GRANT ALL ON TABLE "public"."personas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."personas_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."personas_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."personas_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."tipos_persona" TO "anon";
GRANT ALL ON TABLE "public"."tipos_persona" TO "authenticated";
GRANT ALL ON TABLE "public"."tipos_persona" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tipos_persona_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tipos_persona_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tipos_persona_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



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







