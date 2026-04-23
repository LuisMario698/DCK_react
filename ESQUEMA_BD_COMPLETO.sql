-- ============================================================
-- ESQUEMA COMPLETO BASE DE DATOS - PROYECTO CIAD
-- Exportado: 2026-04-21
-- ============================================================


-- ============================================================
-- MÓDULO: GESTIÓN DE MANIFIESTOS (CIAD)
-- ============================================================

-- TIPOS DE PERSONA
CREATE TABLE public.tipos_persona (
  id bigint NOT NULL DEFAULT nextval('tipos_persona_id_seq'::regclass),
  nombre_tipo text NOT NULL,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tipos_persona_pkey PRIMARY KEY (id),
  CONSTRAINT tipos_persona_nombre_tipo_key UNIQUE (nombre_tipo)
);

-- PERSONAS
CREATE TABLE public.personas (
  id bigint NOT NULL DEFAULT nextval('personas_id_seq'::regclass),
  nombre text NOT NULL,
  tipo_persona_id bigint,
  info_contacto text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  registro_completo boolean DEFAULT true,
  CONSTRAINT personas_pkey PRIMARY KEY (id),
  CONSTRAINT personas_tipo_persona_id_fkey FOREIGN KEY (tipo_persona_id) REFERENCES tipos_persona(id) ON DELETE SET NULL
);

-- ASOCIACIONES RECOLECTORAS
CREATE TABLE public.asociaciones_recolectoras (
  id bigint NOT NULL DEFAULT nextval('asociaciones_recolectoras_id_seq'::regclass),
  nombre_asociacion text NOT NULL,
  tipo_asociacion text,
  contacto_asociacion text,
  email text,
  telefono text,
  direccion text,
  certificaciones text[],
  especialidad text[],
  estado text DEFAULT 'Activo'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT asociaciones_recolectoras_pkey PRIMARY KEY (id),
  CONSTRAINT asociaciones_recolectoras_nombre_asociacion_key UNIQUE (nombre_asociacion),
  CONSTRAINT asociaciones_recolectoras_estado_check CHECK (estado = ANY (ARRAY['Activo'::text, 'Inactivo'::text, 'Suspendido'::text]))
);

-- BUQUES
CREATE TABLE public.buques (
  id bigint NOT NULL DEFAULT nextval('buques_id_seq'::regclass),
  nombre_buque text NOT NULL,
  tipo_buque text,
  propietario_id bigint,
  fecha_registro date DEFAULT CURRENT_DATE,
  matricula text,
  puerto_base text,
  capacidad_toneladas numeric,
  estado text DEFAULT 'Activo'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  registro_completo boolean DEFAULT true,
  CONSTRAINT buques_pkey PRIMARY KEY (id),
  CONSTRAINT unique_nombre_buque UNIQUE (nombre_buque),
  CONSTRAINT buques_matricula_key UNIQUE (matricula),
  CONSTRAINT buques_estado_check CHECK (estado = ANY (ARRAY['Activo'::text, 'Inactivo'::text, 'En Mantenimiento'::text])),
  CONSTRAINT buques_propietario_id_fkey FOREIGN KEY (propietario_id) REFERENCES personas(id) ON DELETE SET NULL
);

-- MANIFIESTOS
CREATE TABLE public.manifiestos (
  id bigint NOT NULL DEFAULT nextval('manifiestos_id_seq'::regclass),
  numero_manifiesto text NOT NULL,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  buque_id bigint,
  responsable_principal_id bigint,
  responsable_secundario_id bigint,
  imagen_manifiesto_url text,
  pdf_manifiesto_url text,
  estado_digitalizacion text DEFAULT 'pendiente'::text,
  digitalizador_id bigint,
  fecha_digitalizacion date,
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT manifiestos_pkey PRIMARY KEY (id),
  CONSTRAINT manifiestos_numero_manifiesto_key UNIQUE (numero_manifiesto),
  CONSTRAINT manifiestos_estado_digitalizacion_check1 CHECK (estado_digitalizacion = ANY (ARRAY['pendiente'::text, 'en_proceso'::text, 'completado'::text])),
  CONSTRAINT manifiestos_buque_id_fkey FOREIGN KEY (buque_id) REFERENCES buques(id) ON DELETE SET NULL,
  CONSTRAINT manifiestos_generador_id_fkey1 FOREIGN KEY (responsable_principal_id) REFERENCES personas(id) ON DELETE SET NULL,
  CONSTRAINT manifiestos_responsable_secundario_id_fkey FOREIGN KEY (responsable_secundario_id) REFERENCES personas(id) ON DELETE SET NULL
);

-- MANIFIESTOS RESIDUOS
CREATE TABLE public.manifiestos_residuos (
  id bigint NOT NULL DEFAULT nextval('manifiestos_residuos_id_seq1'::regclass),
  manifiesto_id bigint NOT NULL,
  aceite_usado numeric DEFAULT 0,
  filtros_aceite integer DEFAULT 0,
  filtros_diesel integer DEFAULT 0,
  filtros_aire integer DEFAULT 0,
  basura numeric DEFAULT 0,
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT manifiestos_residuos_pkey1 PRIMARY KEY (id),
  CONSTRAINT manifiestos_residuos_manifiesto_id_key UNIQUE (manifiesto_id),
  CONSTRAINT manifiestos_residuos_aceite_usado_check CHECK (aceite_usado >= 0),
  CONSTRAINT manifiestos_residuos_filtros_aceite_check CHECK (filtros_aceite >= 0),
  CONSTRAINT manifiestos_residuos_filtros_diesel_check CHECK (filtros_diesel >= 0),
  CONSTRAINT manifiestos_residuos_basura_check CHECK (basura >= 0),
  CONSTRAINT manifiestos_residuos_manifiesto_id_fkey1 FOREIGN KEY (manifiesto_id) REFERENCES manifiestos(id) ON DELETE CASCADE
);

-- MANIFIESTOS NO FIRMADOS
CREATE TABLE public.manifiestos_no_firmados (
  id bigint NOT NULL DEFAULT nextval('manifiestos_no_firmados_id_seq'::regclass),
  manifiesto_id bigint NOT NULL,
  nombre_archivo text NOT NULL,
  ruta_archivo text NOT NULL,
  url_descarga text,
  numero_manifiesto text NOT NULL,
  fecha_generacion timestamp with time zone DEFAULT now(),
  estado text DEFAULT 'pendiente'::text,
  descargado_en timestamp with time zone,
  descargado_por text,
  firmado_en timestamp with time zone,
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT manifiestos_no_firmados_pkey PRIMARY KEY (id),
  CONSTRAINT manifiestos_no_firmados_estado_check CHECK (estado = ANY (ARRAY['pendiente'::text, 'descargado'::text, 'firmado'::text, 'cancelado'::text])),
  CONSTRAINT fk_manifiesto FOREIGN KEY (manifiesto_id) REFERENCES manifiestos(id) ON DELETE CASCADE
);

-- MANIFIESTO BASURÓN
CREATE TABLE public.manifiesto_basuron (
  id bigint NOT NULL DEFAULT nextval('manifiesto_basuron_id_seq'::regclass),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  peso_entrada numeric NOT NULL DEFAULT 0,
  peso_salida numeric DEFAULT 0,
  total_depositado numeric GENERATED ALWAYS AS (peso_entrada - COALESCE(peso_salida, 0)) STORED,
  buque_id bigint,
  observaciones text DEFAULT '',
  hora_entrada time without time zone,
  hora_salida time without time zone,
  nombre_usuario text DEFAULT '',
  pdf_manifiesto_url text,
  recibimos_de text,
  direccion text,
  recibido_por text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT manifiesto_basuron_pkey PRIMARY KEY (id),
  CONSTRAINT manifiesto_basuron_peso_entrada_check CHECK (peso_entrada >= 0),
  CONSTRAINT manifiesto_basuron_peso_salida_check CHECK (peso_salida >= 0),
  CONSTRAINT manifiesto_basuron_buque_id_fkey FOREIGN KEY (buque_id) REFERENCES buques(id) ON DELETE CASCADE
);

-- BITÁCORA
CREATE TABLE public.bitacora (
  id bigint NOT NULL DEFAULT nextval('bitacora_id_seq'::regclass),
  fecha_registro timestamp with time zone DEFAULT now(),
  id_embarcacion bigint,
  usuario_email text,
  accion text,
  CONSTRAINT bitacora_pkey PRIMARY KEY (id)
);


-- ============================================================
-- MÓDULO: AUTENTICACIÓN Y PERFILES
-- ============================================================

-- PROFILES (vinculado a auth.users)
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);


-- ============================================================
-- MÓDULO: SISTEMA DE PEDIDOS (POS/Restaurante)
-- ============================================================

-- TENANTS
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#6F4E37'::text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id),
  CONSTRAINT tenants_slug_key UNIQUE (slug)
);

-- USERS (sistema POS)
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  auth_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_auth_id_key UNIQUE (auth_id),
  CONSTRAINT users_tenant_id_email_key UNIQUE (tenant_id, email),
  CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['admin'::text, 'cashier'::text, 'waiter'::text, 'kitchen'::text])),
  CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT users_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- PRODUCTS
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  category_id uuid,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  sku text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_price_check CHECK (price >= 0),
  CONSTRAINT products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ORDERS
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  tip numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['pending'::text, 'preparing'::text, 'ready'::text, 'completed'::text, 'cancelled'::text])),
  CONSTRAINT orders_payment_method_check CHECK (payment_method = ANY (ARRAY['cash'::text, 'card'::text, 'transfer'::text])),
  CONSTRAINT orders_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT orders_tax_check CHECK (tax >= 0),
  CONSTRAINT orders_tip_check CHECK (tip >= 0),
  CONSTRAINT orders_total_check CHECK (total >= 0),
  CONSTRAINT orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid,
  name text NOT NULL,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  subtotal numeric NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_check CHECK (unit_price >= 0),
  CONSTRAINT order_items_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT order_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);
