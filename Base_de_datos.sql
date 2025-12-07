-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.asociaciones_recolectoras (
  id bigint NOT NULL DEFAULT nextval('asociaciones_recolectoras_id_seq'::regclass),
  nombre_asociacion text NOT NULL UNIQUE,
  tipo_asociacion text,
  contacto_asociacion text,
  email text,
  telefono text,
  direccion text,
  certificaciones ARRAY,
  especialidad ARRAY,
  estado text DEFAULT 'Activo'::text CHECK (estado = ANY (ARRAY['Activo'::text, 'Inactivo'::text, 'Suspendido'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT asociaciones_recolectoras_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bitacora (
  id bigint NOT NULL DEFAULT nextval('bitacora_id_seq'::regclass),
  fecha_registro timestamp with time zone DEFAULT now(),
  id_embarcacion bigint,
  usuario_email text,
  accion text,
  CONSTRAINT bitacora_pkey PRIMARY KEY (id)
);
CREATE TABLE public.buques (
  id bigint NOT NULL DEFAULT nextval('buques_id_seq'::regclass),
  nombre_buque text NOT NULL,
  tipo_buque text,
  propietario_id bigint,
  fecha_registro date DEFAULT CURRENT_DATE,
  matricula text UNIQUE,
  puerto_base text,
  capacidad_toneladas numeric,
  estado text DEFAULT 'Activo'::text CHECK (estado = ANY (ARRAY['Activo'::text, 'Inactivo'::text, 'En Mantenimiento'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  registro_completo boolean DEFAULT true,
  CONSTRAINT buques_pkey PRIMARY KEY (id),
  CONSTRAINT buques_propietario_id_fkey FOREIGN KEY (propietario_id) REFERENCES public.personas(id)
);
CREATE TABLE public.manifiesto_basuron (
  id bigint NOT NULL DEFAULT nextval('manifiesto_basuron_id_seq'::regclass),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  peso_entrada numeric NOT NULL DEFAULT '0'::numeric CHECK (peso_entrada >= 0::numeric),
  peso_salida numeric DEFAULT '0'::numeric CHECK (peso_salida >= 0::numeric),
  total_depositado numeric DEFAULT (peso_entrada - COALESCE(peso_salida, (0)::numeric)),
  buque_id bigint NOT NULL,
  observaciones text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  hora_entrada time without time zone,
  hora_salida time without time zone,
  nombre_usuario text DEFAULT ''::text,
  CONSTRAINT manifiesto_basuron_pkey PRIMARY KEY (id),
  CONSTRAINT manifiesto_basuron_buque_id_fkey FOREIGN KEY (buque_id) REFERENCES public.buques(id)
);
CREATE TABLE public.manifiestos (
  id bigint NOT NULL DEFAULT nextval('manifiestos_id_seq'::regclass),
  numero_manifiesto text NOT NULL UNIQUE,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  buque_id bigint,
  responsable_principal_id bigint,
  imagen_manifiesto_url text,
  estado_digitalizacion text DEFAULT 'pendiente'::text CHECK (estado_digitalizacion = ANY (ARRAY['pendiente'::text, 'en_proceso'::text, 'completado'::text])),
  digitalizador_id bigint,
  fecha_digitalizacion date,
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  responsable_secundario_id bigint,
  CONSTRAINT manifiestos_pkey PRIMARY KEY (id),
  CONSTRAINT manifiestos_responsable_secundario_id_fkey FOREIGN KEY (responsable_secundario_id) REFERENCES public.personas(id),
  CONSTRAINT manifiestos_buque_id_fkey FOREIGN KEY (buque_id) REFERENCES public.buques(id),
  CONSTRAINT manifiestos_generador_id_fkey1 FOREIGN KEY (responsable_principal_id) REFERENCES public.personas(id)
);
CREATE TABLE public.manifiestos_no_firmados (
  id bigint NOT NULL DEFAULT nextval('manifiestos_no_firmados_id_seq'::regclass),
  manifiesto_id bigint NOT NULL,
  nombre_archivo text NOT NULL,
  ruta_archivo text NOT NULL,
  url_descarga text,
  numero_manifiesto text NOT NULL,
  fecha_generacion timestamp with time zone DEFAULT now(),
  estado text DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'descargado'::text, 'firmado'::text, 'cancelado'::text])),
  descargado_en timestamp with time zone,
  descargado_por text,
  firmado_en timestamp with time zone,
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT manifiestos_no_firmados_pkey PRIMARY KEY (id),
  CONSTRAINT fk_manifiesto FOREIGN KEY (manifiesto_id) REFERENCES public.manifiestos(id)
);
CREATE TABLE public.manifiestos_residuos (
  id bigint NOT NULL DEFAULT nextval('manifiestos_residuos_id_seq1'::regclass),
  manifiesto_id bigint NOT NULL UNIQUE,
  aceite_usado numeric DEFAULT 0 CHECK (aceite_usado >= 0::numeric),
  filtros_aceite integer DEFAULT 0 CHECK (filtros_aceite >= 0),
  filtros_diesel integer DEFAULT 0 CHECK (filtros_diesel >= 0),
  basura numeric DEFAULT 0 CHECK (basura >= 0::numeric),
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  filtros_aire integer DEFAULT 0,
  CONSTRAINT manifiestos_residuos_pkey PRIMARY KEY (id),
  CONSTRAINT manifiestos_residuos_manifiesto_id_fkey1 FOREIGN KEY (manifiesto_id) REFERENCES public.manifiestos(id)
);
CREATE TABLE public.personas (
  id bigint NOT NULL DEFAULT nextval('personas_id_seq'::regclass),
  nombre text NOT NULL,
  tipo_persona_id bigint,
  info_contacto text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  registro_completo boolean DEFAULT true,
  CONSTRAINT personas_pkey PRIMARY KEY (id),
  CONSTRAINT personas_tipo_persona_id_fkey FOREIGN KEY (tipo_persona_id) REFERENCES public.tipos_persona(id)
);
CREATE TABLE public.tipos_persona (
  id bigint NOT NULL DEFAULT nextval('tipos_persona_id_seq'::regclass),
  nombre_tipo text NOT NULL UNIQUE,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tipos_persona_pkey PRIMARY KEY (id)
);