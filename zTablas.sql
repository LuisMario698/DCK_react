-- -- ============================================
-- -- SISTEMA DE GESTIÓN DE RESIDUOS MARÍTIMOS
-- -- Script de creación de tablas para Supabase
-- -- ============================================

-- -- Habilitar extensiones necesarias
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -- ============================================
-- -- 1. TABLA: tipos_persona (person_types)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS tipos_persona (
--     id BIGSERIAL PRIMARY KEY,
--     nombre_tipo TEXT NOT NULL UNIQUE,
--     descripcion TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Insertar tipos de persona por defecto
-- INSERT INTO tipos_persona (nombre_tipo, descripcion) VALUES
--     ('Capitán', 'Capitán de embarcación'),
--     ('Tripulante', 'Miembro de la tripulación'),
--     ('Inspector', 'Inspector de cumplimiento'),
--     ('Administrativo', 'Personal administrativo'),
--     ('Propietario', 'Propietario de embarcación')
-- ON CONFLICT (nombre_tipo) DO NOTHING;

-- -- ============================================
-- -- 2. TABLA: personas (persons)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS personas (
--     id BIGSERIAL PRIMARY KEY,
--     nombre TEXT NOT NULL,
--     tipo_persona_id BIGINT REFERENCES tipos_persona(id) ON DELETE SET NULL,
--     info_contacto TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para personas
-- CREATE INDEX IF NOT EXISTS idx_personas_tipo ON personas(tipo_persona_id);
-- CREATE INDEX IF NOT EXISTS idx_personas_nombre ON personas(nombre);

-- -- ============================================
-- -- 3. TABLA: buques (vessels)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS buques (
--     id BIGSERIAL PRIMARY KEY,
--     nombre_buque TEXT NOT NULL,
--     tipo_buque TEXT,
--     propietario_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
--     fecha_registro DATE DEFAULT CURRENT_DATE,
--     matricula TEXT UNIQUE,
--     puerto_base TEXT,
--     capacidad_toneladas NUMERIC(10, 2),
--     estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'En Mantenimiento')),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para buques
-- CREATE INDEX IF NOT EXISTS idx_buques_propietario ON buques(propietario_id);
-- CREATE INDEX IF NOT EXISTS idx_buques_tipo ON buques(tipo_buque);
-- CREATE INDEX IF NOT EXISTS idx_buques_estado ON buques(estado);

-- -- ============================================
-- -- 4. TABLA: tipos_residuos (waste_types)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS tipos_residuos (
--     id BIGSERIAL PRIMARY KEY,
--     nombre_tipo TEXT NOT NULL UNIQUE,
--     metrica TEXT DEFAULT 'kg',
--     descripcion TEXT,
--     categoria TEXT, -- Orgánico, Plástico, Metal, Químico, etc.
--     peligrosidad TEXT DEFAULT 'Baja' CHECK (peligrosidad IN ('Baja', 'Media', 'Alta')),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Insertar tipos de residuos por defecto
-- INSERT INTO tipos_residuos (nombre_tipo, metrica, descripcion, categoria, peligrosidad) VALUES
--     ('Plástico PET', 'kg', 'Botellas y envases de plástico PET', 'Plástico', 'Baja'),
--     ('Plástico HDPE', 'kg', 'Plástico de alta densidad', 'Plástico', 'Baja'),
--     ('Metal - Aluminio', 'kg', 'Latas y recipientes de aluminio', 'Metal', 'Baja'),
--     ('Metal - Acero', 'kg', 'Chatarra y piezas de acero', 'Metal', 'Baja'),
--     ('Vidrio', 'kg', 'Botellas y envases de vidrio', 'Vidrio', 'Baja'),
--     ('Orgánico', 'kg', 'Residuos orgánicos y biodegradables', 'Orgánico', 'Baja'),
--     ('Aceites usados', 'litros', 'Aceites lubricantes y combustibles usados', 'Químico', 'Alta'),
--     ('Baterías', 'unidades', 'Baterías y pilas usadas', 'Químico', 'Alta'),
--     ('Residuos electrónicos', 'kg', 'Equipos electrónicos obsoletos', 'Electrónico', 'Media'),
--     ('Papel y cartón', 'kg', 'Papel, cartón y documentos', 'Papel', 'Baja')
-- ON CONFLICT (nombre_tipo) DO NOTHING;

-- -- Índices para tipos_residuos
-- CREATE INDEX IF NOT EXISTS idx_tipos_residuos_categoria ON tipos_residuos(categoria);
-- CREATE INDEX IF NOT EXISTS idx_tipos_residuos_peligrosidad ON tipos_residuos(peligrosidad);

-- -- ============================================
-- -- 5. TABLA: usuarios_sistema (system_users)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS usuarios_sistema (
--     id BIGSERIAL PRIMARY KEY,
--     nombre_usuario TEXT NOT NULL UNIQUE,
--     rol TEXT DEFAULT 'Usuario' CHECK (rol IN ('Administrador', 'Usuario', 'Supervisor', 'Inspector')),
--     contacto_usuario TEXT,
--     email TEXT UNIQUE NOT NULL,
--     hash_contraseña TEXT NOT NULL,
--     estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido')),
--     ultimo_acceso TIMESTAMP WITH TIME ZONE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para usuarios_sistema
-- CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios_sistema(email);
-- CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios_sistema(rol);

-- -- ============================================
-- -- 6. TABLA: cumplimiento (compliance)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS cumplimiento (
--     id BIGSERIAL PRIMARY KEY,
--     buque_id BIGINT REFERENCES buques(id) ON DELETE CASCADE,
--     fecha_inspeccion DATE DEFAULT CURRENT_DATE,
--     observaciones TEXT,
--     usuario_sistema_id BIGINT REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
--     calificacion TEXT CHECK (calificacion IN ('Excelente', 'Bueno', 'Regular', 'Deficiente')),
--     estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado')),
--     documento_url TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para cumplimiento
-- CREATE INDEX IF NOT EXISTS idx_cumplimiento_buque ON cumplimiento(buque_id);
-- CREATE INDEX IF NOT EXISTS idx_cumplimiento_usuario ON cumplimiento(usuario_sistema_id);
-- CREATE INDEX IF NOT EXISTS idx_cumplimiento_fecha ON cumplimiento(fecha_inspeccion);
-- CREATE INDEX IF NOT EXISTS idx_cumplimiento_estado ON cumplimiento(estado);

-- -- ============================================
-- -- 7. TABLA: residuos (waste)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS residuos (
--     id BIGSERIAL PRIMARY KEY,
--     buque_id BIGINT REFERENCES buques(id) ON DELETE CASCADE,
--     tipo_residuo_id BIGINT REFERENCES tipos_residuos(id) ON DELETE SET NULL,
--     cantidad_generada NUMERIC(10, 2) NOT NULL CHECK (cantidad_generada >= 0),
--     fecha_generacion DATE DEFAULT CURRENT_DATE,
--     cumplimiento_id BIGINT REFERENCES cumplimiento(id) ON DELETE SET NULL,
--     estado TEXT DEFAULT 'Generado' CHECK (estado IN ('Generado', 'Almacenado', 'Recolectado', 'Procesado')),
--     ubicacion_almacenamiento TEXT,
--     observaciones TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para residuos
-- CREATE INDEX IF NOT EXISTS idx_residuos_buque ON residuos(buque_id);
-- CREATE INDEX IF NOT EXISTS idx_residuos_tipo ON residuos(tipo_residuo_id);
-- CREATE INDEX IF NOT EXISTS idx_residuos_cumplimiento ON residuos(cumplimiento_id);
-- CREATE INDEX IF NOT EXISTS idx_residuos_fecha ON residuos(fecha_generacion);
-- CREATE INDEX IF NOT EXISTS idx_residuos_estado ON residuos(estado);

-- -- ============================================
-- -- 8. TABLA: asociaciones_recolectoras (collector_associations)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS asociaciones_recolectoras (
--     id BIGSERIAL PRIMARY KEY,
--     nombre_asociacion TEXT NOT NULL UNIQUE,
--     tipo_asociacion TEXT,
--     contacto_asociacion TEXT,
--     email TEXT,
--     telefono TEXT,
--     direccion TEXT,
--     certificaciones TEXT[], -- Array de certificaciones
--     especialidad TEXT[], -- Tipos de residuos que manejan
--     estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido')),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para asociaciones_recolectoras
-- CREATE INDEX IF NOT EXISTS idx_asociaciones_tipo ON asociaciones_recolectoras(tipo_asociacion);
-- CREATE INDEX IF NOT EXISTS idx_asociaciones_estado ON asociaciones_recolectoras(estado);

-- -- ============================================
-- -- 9. TABLA: reutilizacion_residuos (waste_reutilization)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS reutilizacion_residuos (
--     id BIGSERIAL PRIMARY KEY,
--     residuo_id BIGINT REFERENCES residuos(id) ON DELETE CASCADE,
--     asociacion_id BIGINT REFERENCES asociaciones_recolectoras(id) ON DELETE SET NULL,
--     fecha_reutilizacion DATE DEFAULT CURRENT_DATE,
--     cantidad_reutilizada NUMERIC(10, 2) NOT NULL CHECK (cantidad_reutilizada >= 0),
--     metodo_reutilizacion TEXT, -- Reciclaje, Compostaje, Reutilización directa, etc.
--     producto_final TEXT, -- Qué se generó a partir del residuo
--     impacto_ambiental TEXT,
--     costo_proceso NUMERIC(10, 2),
--     ingreso_generado NUMERIC(10, 2),
--     observaciones TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para reutilizacion_residuos
-- CREATE INDEX IF NOT EXISTS idx_reutilizacion_residuo ON reutilizacion_residuos(residuo_id);
-- CREATE INDEX IF NOT EXISTS idx_reutilizacion_asociacion ON reutilizacion_residuos(asociacion_id);
-- CREATE INDEX IF NOT EXISTS idx_reutilizacion_fecha ON reutilizacion_residuos(fecha_reutilizacion);

-- -- ============================================
-- -- 10. TABLA: manifiestos (manifests)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS manifiestos (
--     id BIGSERIAL PRIMARY KEY,
--     numero_manifiesto TEXT UNIQUE NOT NULL,
--     fecha_emision DATE DEFAULT CURRENT_DATE NOT NULL,
--     buque_id BIGINT REFERENCES buques(id) ON DELETE CASCADE NOT NULL,
--     responsable_principal_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
--     responsable_secundario_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
--     imagen_manifiesto_url TEXT,
--     estado_digitalizacion TEXT DEFAULT 'pendiente' CHECK (estado_digitalizacion IN ('pendiente', 'en_proceso', 'completado', 'aprobado', 'rechazado')),
--     observaciones TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para manifiestos
-- CREATE INDEX IF NOT EXISTS idx_manifiestos_buque ON manifiestos(buque_id);
-- CREATE INDEX IF NOT EXISTS idx_manifiestos_responsable_principal ON manifiestos(responsable_principal_id);
-- CREATE INDEX IF NOT EXISTS idx_manifiestos_responsable_secundario ON manifiestos(responsable_secundario_id);
-- CREATE INDEX IF NOT EXISTS idx_manifiestos_numero ON manifiestos(numero_manifiesto);
-- CREATE INDEX IF NOT EXISTS idx_manifiestos_fecha ON manifiestos(fecha_emision);
-- CREATE INDEX IF NOT EXISTS idx_manifiestos_estado ON manifiestos(estado_digitalizacion);

-- -- ============================================
-- -- 10.1 TABLA: manifiestos_residuos (manifest_waste)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS manifiestos_residuos (
--     id BIGSERIAL PRIMARY KEY,
--     manifiesto_id BIGINT REFERENCES manifiestos(id) ON DELETE CASCADE NOT NULL UNIQUE,
--     aceite_usado NUMERIC(10, 2) DEFAULT 0 CHECK (aceite_usado >= 0),
--     filtros_aceite INTEGER DEFAULT 0 CHECK (filtros_aceite >= 0),
--     filtros_diesel INTEGER DEFAULT 0 CHECK (filtros_diesel >= 0),
--     basura NUMERIC(10, 2) DEFAULT 0 CHECK (basura >= 0),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para manifiestos_residuos
-- CREATE INDEX IF NOT EXISTS idx_manifiestos_residuos_manifiesto ON manifiestos_residuos(manifiesto_id);

-- -- ============================================
-- -- 11. TABLA: manifiesto_basuron (waste_dump_manifest)
-- -- ============================================
-- CREATE TABLE IF NOT EXISTS manifiesto_basuron (
--     id BIGSERIAL PRIMARY KEY,
--     fecha DATE DEFAULT CURRENT_DATE NOT NULL,
--     hora_entrada TIME NOT NULL,
--     hora_salida TIME,
--     peso_entrada NUMERIC(10, 2) NOT NULL CHECK (peso_entrada >= 0),
--     peso_salida NUMERIC(10, 2) CHECK (peso_salida >= 0),
--     total_depositado NUMERIC(10, 2) GENERATED ALWAYS AS (peso_entrada - COALESCE(peso_salida, 0)) STORED,
--     observaciones TEXT,
--     buque_id BIGINT REFERENCES buques(id) ON DELETE CASCADE NOT NULL,
--     usuario_sistema_id BIGINT REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
--     estado TEXT DEFAULT 'En Proceso' CHECK (estado IN ('En Proceso', 'Completado', 'Cancelado')),
--     numero_ticket TEXT UNIQUE,
--     tipo_residuo_id BIGINT REFERENCES tipos_residuos(id) ON DELETE SET NULL,
--     comprobante_url TEXT, -- URL del comprobante o ticket escaneado
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Índices para manifiesto_basuron
-- CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_fecha ON manifiesto_basuron(fecha);
-- CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_buque ON manifiesto_basuron(buque_id);
-- CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_usuario ON manifiesto_basuron(usuario_sistema_id);
-- CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_estado ON manifiesto_basuron(estado);
-- CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_ticket ON manifiesto_basuron(numero_ticket);

-- -- Trigger para generar número de ticket automáticamente
-- CREATE OR REPLACE FUNCTION generar_numero_ticket()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.numero_ticket IS NULL THEN
--         NEW.numero_ticket := 'TKT-' || TO_CHAR(NEW.fecha, 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_generar_numero_ticket
--     BEFORE INSERT ON manifiesto_basuron
--     FOR EACH ROW
--     EXECUTE FUNCTION generar_numero_ticket();

-- -- ============================================
-- -- TRIGGERS PARA ACTUALIZAR updated_at
-- -- ============================================

-- -- Función genérica para actualizar updated_at
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- -- Triggers para cada tabla
-- CREATE TRIGGER update_tipos_persona_updated_at BEFORE UPDATE ON tipos_persona
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_buques_updated_at BEFORE UPDATE ON buques
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_tipos_residuos_updated_at BEFORE UPDATE ON tipos_residuos
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_usuarios_sistema_updated_at BEFORE UPDATE ON usuarios_sistema
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_cumplimiento_updated_at BEFORE UPDATE ON cumplimiento
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_residuos_updated_at BEFORE UPDATE ON residuos
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_asociaciones_recolectoras_updated_at BEFORE UPDATE ON asociaciones_recolectoras
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_reutilizacion_residuos_updated_at BEFORE UPDATE ON reutilizacion_residuos
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_manifiestos_updated_at BEFORE UPDATE ON manifiestos
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_manifiesto_basuron_updated_at BEFORE UPDATE ON manifiesto_basuron
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- ============================================
-- -- VISTAS ÚTILES
-- -- ============================================

-- -- Vista: Resumen de residuos por buque
-- CREATE OR REPLACE VIEW vista_residuos_por_buque AS
-- SELECT 
--     b.id AS buque_id,
--     b.nombre_buque,
--     tr.nombre_tipo AS tipo_residuo,
--     SUM(r.cantidad_generada) AS cantidad_total,
--     tr.metrica,
--     COUNT(r.id) AS registros,
--     MAX(r.fecha_generacion) AS ultima_generacion
-- FROM residuos r
-- JOIN buques b ON r.buque_id = b.id
-- JOIN tipos_residuos tr ON r.tipo_residuo_id = tr.id
-- GROUP BY b.id, b.nombre_buque, tr.nombre_tipo, tr.metrica;

-- -- Vista: Estadísticas de reutilización
-- CREATE OR REPLACE VIEW vista_estadisticas_reutilizacion AS
-- SELECT 
--     ar.nombre_asociacion,
--     COUNT(rr.id) AS total_reutilizaciones,
--     SUM(rr.cantidad_reutilizada) AS cantidad_total_reutilizada,
--     SUM(rr.ingreso_generado) AS ingreso_total,
--     AVG(rr.costo_proceso) AS costo_promedio
-- FROM reutilizacion_residuos rr
-- JOIN asociaciones_recolectoras ar ON rr.asociacion_id = ar.id
-- GROUP BY ar.nombre_asociacion;

-- -- Vista: Estado de cumplimiento por buque
-- CREATE OR REPLACE VIEW vista_cumplimiento_buques AS
-- SELECT 
--     b.id AS buque_id,
--     b.nombre_buque,
--     COUNT(c.id) AS total_inspecciones,
--     SUM(CASE WHEN c.estado = 'Aprobado' THEN 1 ELSE 0 END) AS aprobadas,
--     SUM(CASE WHEN c.estado = 'Rechazado' THEN 1 ELSE 0 END) AS rechazadas,
--     MAX(c.fecha_inspeccion) AS ultima_inspeccion
-- FROM buques b
-- LEFT JOIN cumplimiento c ON b.id = c.buque_id
-- GROUP BY b.id, b.nombre_buque;

-- -- Vista: Manifiestos de basurón por buque
-- CREATE OR REPLACE VIEW vista_manifiestos_basuron AS
-- SELECT 
--     mb.id,
--     mb.fecha,
--     mb.numero_ticket,
--     b.nombre_buque,
--     b.id AS buque_id,
--     mb.hora_entrada,
--     mb.hora_salida,
--     mb.peso_entrada,
--     mb.peso_salida,
--     mb.total_depositado,
--     tr.nombre_tipo AS tipo_residuo,
--     tr.metrica,
--     us.nombre_usuario AS registrado_por,
--     mb.estado,
--     mb.observaciones,
--     mb.created_at
-- FROM manifiesto_basuron mb
-- JOIN buques b ON mb.buque_id = b.id
-- LEFT JOIN tipos_residuos tr ON mb.tipo_residuo_id = tr.id
-- LEFT JOIN usuarios_sistema us ON mb.usuario_sistema_id = us.id
-- ORDER BY mb.fecha DESC, mb.hora_entrada DESC;

-- -- Vista: Resumen diario de depósitos en basurón
-- CREATE OR REPLACE VIEW vista_resumen_diario_basuron AS
-- SELECT 
--     mb.fecha,
--     COUNT(mb.id) AS total_depositos,
--     SUM(mb.total_depositado) AS peso_total_depositado,
--     COUNT(DISTINCT mb.buque_id) AS buques_distintos,
--     AVG(mb.total_depositado) AS promedio_depositado,
--     MIN(mb.hora_entrada) AS primera_entrada,
--     MAX(COALESCE(mb.hora_salida, mb.hora_entrada)) AS ultima_salida
-- FROM manifiesto_basuron mb
-- WHERE mb.estado = 'Completado'
-- GROUP BY mb.fecha
-- ORDER BY mb.fecha DESC;

-- -- ============================================
-- -- DATOS DE EJEMPLO (OPCIONAL)
-- -- ============================================

-- -- Insertar un usuario administrador de ejemplo
-- -- NOTA: Cambiar la contraseña en producción
-- INSERT INTO usuarios_sistema (nombre_usuario, rol, email, hash_contraseña, contacto_usuario) VALUES
--     ('admin', 'Administrador', 'admin@ciad.com', '$2a$10$ejemplo_hash_contraseña', '+506 8888-8888')
-- ON CONFLICT (email) DO NOTHING;

-- -- Insertar algunas asociaciones de ejemplo
-- INSERT INTO asociaciones_recolectoras (nombre_asociacion, tipo_asociacion, contacto_asociacion, email, especialidad, estado) VALUES
--     ('Asociación de Recicladores del Pacífico', 'Reciclaje', '+506 2222-3333', 'info@recicladores.cr', ARRAY['Plástico', 'Metal', 'Vidrio'], 'Activo'),
--     ('Cooperativa de Gestión Ambiental', 'Cooperativa', '+506 2333-4444', 'contacto@coopambiental.cr', ARRAY['Orgánico', 'Papel'], 'Activo'),
--     ('Empresa de Tratamiento de Residuos Peligrosos', 'Empresa Privada', '+506 2444-5555', 'ventas@residuospeligrosos.cr', ARRAY['Aceites usados', 'Químico'], 'Activo')
-- ON CONFLICT (nombre_asociacion) DO NOTHING;

-- -- ============================================
-- -- POLÍTICAS DE SEGURIDAD (RLS) - Row Level Security
-- -- ============================================

-- -- Habilitar RLS en todas las tablas
-- ALTER TABLE tipos_persona ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE buques ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tipos_residuos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cumplimiento ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE residuos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE asociaciones_recolectoras ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reutilizacion_residuos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE manifiestos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE manifiesto_basuron ENABLE ROW LEVEL SECURITY;

-- -- Políticas de ejemplo (permitir lectura para usuarios autenticados)
-- -- IMPORTANTE: Ajustar según tus necesidades de seguridad

-- CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON tipos_persona
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON personas
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON buques
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON tipos_residuos
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON residuos
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON asociaciones_recolectoras
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON reutilizacion_residuos
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON manifiestos
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON manifiesto_basuron
--     FOR SELECT USING (auth.role() = 'authenticated');

-- -- ============================================
-- -- FIN DEL SCRIPT
-- -- ============================================

-- -- Verificar la creación de tablas
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;







create table public.asociaciones_recolectoras (
  id bigserial not null,
  nombre_asociacion text not null,
  tipo_asociacion text null,
  contacto_asociacion text null,
  email text null,
  telefono text null,
  direccion text null,
  certificaciones text[] null,
  especialidad text[] null,
  estado text null default 'Activo'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint asociaciones_recolectoras_pkey primary key (id),
  constraint asociaciones_recolectoras_nombre_asociacion_key unique (nombre_asociacion),
  constraint asociaciones_recolectoras_estado_check check (
    (
      estado = any (
        array[
          'Activo'::text,
          'Inactivo'::text,
          'Suspendido'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_asociaciones_tipo on public.asociaciones_recolectoras using btree (tipo_asociacion) TABLESPACE pg_default;

create index IF not exists idx_asociaciones_estado on public.asociaciones_recolectoras using btree (estado) TABLESPACE pg_default;

create trigger update_asociaciones_recolectoras_updated_at BEFORE
update on asociaciones_recolectoras for EACH row
execute FUNCTION update_updated_at_column ();



create table public.buques (
  id bigserial not null,
  nombre_buque text not null,
  tipo_buque text null,
  propietario_id bigint null,
  fecha_registro date null default CURRENT_DATE,
  matricula text null,
  puerto_base text null,
  capacidad_toneladas numeric(10, 2) null,
  estado text null default 'Activo'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint buques_pkey primary key (id),
  constraint buques_matricula_key unique (matricula),
  constraint buques_propietario_id_fkey foreign KEY (propietario_id) references personas (id) on delete set null,
  constraint buques_estado_check check (
    (
      estado = any (
        array[
          'Activo'::text,
          'Inactivo'::text,
          'En Mantenimiento'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_buques_propietario on public.buques using btree (propietario_id) TABLESPACE pg_default;

create index IF not exists idx_buques_tipo on public.buques using btree (tipo_buque) TABLESPACE pg_default;

create index IF not exists idx_buques_estado on public.buques using btree (estado) TABLESPACE pg_default;

create trigger update_buques_updated_at BEFORE
update on buques for EACH row
execute FUNCTION update_updated_at_column ();



create table public.cumplimiento (
  id bigserial not null,
  buque_id bigint null,
  fecha_inspeccion date null default CURRENT_DATE,
  observaciones text null,
  usuario_sistema_id bigint null,
  calificacion text null,
  estado text null default 'Pendiente'::text,
  documento_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint cumplimiento_pkey primary key (id),
  constraint cumplimiento_buque_id_fkey foreign KEY (buque_id) references buques (id) on delete CASCADE,
  constraint cumplimiento_usuario_sistema_id_fkey foreign KEY (usuario_sistema_id) references usuarios_sistema (id) on delete set null,
  constraint cumplimiento_calificacion_check check (
    (
      calificacion = any (
        array[
          'Excelente'::text,
          'Bueno'::text,
          'Regular'::text,
          'Deficiente'::text
        ]
      )
    )
  ),
  constraint cumplimiento_estado_check check (
    (
      estado = any (
        array[
          'Pendiente'::text,
          'Aprobado'::text,
          'Rechazado'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_cumplimiento_buque on public.cumplimiento using btree (buque_id) TABLESPACE pg_default;

create index IF not exists idx_cumplimiento_usuario on public.cumplimiento using btree (usuario_sistema_id) TABLESPACE pg_default;

create index IF not exists idx_cumplimiento_fecha on public.cumplimiento using btree (fecha_inspeccion) TABLESPACE pg_default;

create index IF not exists idx_cumplimiento_estado on public.cumplimiento using btree (estado) TABLESPACE pg_default;

create trigger update_cumplimiento_updated_at BEFORE
update on cumplimiento for EACH row
execute FUNCTION update_updated_at_column ();


create table public.manifiesto_basuron (
  id bigserial not null,
  fecha date not null default CURRENT_DATE,
  hora_entrada time without time zone not null,
  hora_salida time without time zone null,
  peso_entrada numeric(10, 2) not null,
  peso_salida numeric(10, 2) null,
  total_depositado numeric GENERATED ALWAYS as (
    (
      peso_entrada - COALESCE(peso_salida, (0)::numeric)
    )
  ) STORED (10, 2) null,
  observaciones text null,
  buque_id bigint not null,
  usuario_sistema_id bigint null,
  estado text null default 'En Proceso'::text,
  numero_ticket text null,
  tipo_residuo_id bigint null,
  comprobante_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint manifiesto_basuron_pkey primary key (id),
  constraint manifiesto_basuron_numero_ticket_key unique (numero_ticket),
  constraint manifiesto_basuron_buque_id_fkey foreign KEY (buque_id) references buques (id) on delete CASCADE,
  constraint manifiesto_basuron_tipo_residuo_id_fkey foreign KEY (tipo_residuo_id) references tipos_residuos (id) on delete set null,
  constraint manifiesto_basuron_usuario_sistema_id_fkey foreign KEY (usuario_sistema_id) references usuarios_sistema (id) on delete set null,
  constraint manifiesto_basuron_estado_check check (
    (
      estado = any (
        array[
          'En Proceso'::text,
          'Completado'::text,
          'Cancelado'::text
        ]
      )
    )
  ),
  constraint manifiesto_basuron_peso_entrada_check check ((peso_entrada >= (0)::numeric)),
  constraint manifiesto_basuron_peso_salida_check check ((peso_salida >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_manifiesto_basuron_fecha on public.manifiesto_basuron using btree (fecha) TABLESPACE pg_default;

create index IF not exists idx_manifiesto_basuron_buque on public.manifiesto_basuron using btree (buque_id) TABLESPACE pg_default;

create index IF not exists idx_manifiesto_basuron_usuario on public.manifiesto_basuron using btree (usuario_sistema_id) TABLESPACE pg_default;

create index IF not exists idx_manifiesto_basuron_estado on public.manifiesto_basuron using btree (estado) TABLESPACE pg_default;

create index IF not exists idx_manifiesto_basuron_ticket on public.manifiesto_basuron using btree (numero_ticket) TABLESPACE pg_default;

create trigger trigger_generar_numero_ticket BEFORE INSERT on manifiesto_basuron for EACH row
execute FUNCTION generar_numero_ticket ();

create trigger update_manifiesto_basuron_updated_at BEFORE
update on manifiesto_basuron for EACH row
execute FUNCTION update_updated_at_column ();


create table public.manifiestos (
  id bigserial not null,
  numero_manifiesto text not null,
  fecha_emision date not null default CURRENT_DATE,
  buque_id bigint null,
  responsable_principal_id bigint null,
  imagen_manifiesto_url text null,
  estado_digitalizacion text null default 'pendiente'::text,
  digitalizador_id bigint null,
  fecha_digitalizacion date null,
  observaciones text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  responsable_secundario_id bigint null,
  constraint manifiestos_pkey primary key (id),
  constraint manifiestos_numero_manifiesto_key unique (numero_manifiesto),
  constraint manifiestos_buque_id_fkey foreign KEY (buque_id) references buques (id) on delete set null,
  constraint manifiestos_generador_id_fkey1 foreign KEY (responsable_principal_id) references personas (id) on delete set null,
  constraint manifiestos_digitalizador_id_fkey1 foreign KEY (digitalizador_id) references usuarios_sistema (id) on delete set null,
  constraint manifiestos_responsable_secundario_id_fkey foreign KEY (responsable_secundario_id) references personas (id) on delete set null,
  constraint manifiestos_estado_digitalizacion_check1 check (
    (
      estado_digitalizacion = any (
        array[
          'pendiente'::text,
          'en_proceso'::text,
          'completado'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_manifiestos_buque on public.manifiestos using btree (buque_id) TABLESPACE pg_default;

create index IF not exists idx_manifiestos_numero on public.manifiestos using btree (numero_manifiesto) TABLESPACE pg_default;

create index IF not exists idx_manifiestos_estado on public.manifiestos using btree (estado_digitalizacion) TABLESPACE pg_default;

create index IF not exists idx_manifiestos_responsable_secundario on public.manifiestos using btree (responsable_secundario_id) TABLESPACE pg_default;

create index IF not exists idx_manifiestos_responsable_principal on public.manifiestos using btree (responsable_principal_id) TABLESPACE pg_default;

create trigger trigger_update_manifiestos_updated_at BEFORE
update on manifiestos for EACH row
execute FUNCTION update_manifiestos_updated_at ();


create table public.manifiestos_residuos (
  id bigserial not null,
  manifiesto_id bigint not null,
  aceite_usado numeric(10, 2) null default 0,
  filtros_aceite integer null default 0,
  filtros_diesel integer null default 0,
  basura numeric(10, 2) null default 0,
  observaciones text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint manifiestos_residuos_pkey1 primary key (id),
  constraint manifiestos_residuos_manifiesto_id_key unique (manifiesto_id),
  constraint manifiestos_residuos_manifiesto_id_fkey1 foreign KEY (manifiesto_id) references manifiestos (id) on delete CASCADE,
  constraint manifiestos_residuos_aceite_usado_check check ((aceite_usado >= (0)::numeric)),
  constraint manifiestos_residuos_filtros_diesel_check check ((filtros_diesel >= 0)),
  constraint manifiestos_residuos_basura_check check ((basura >= (0)::numeric)),
  constraint manifiestos_residuos_filtros_aceite_check check ((filtros_aceite >= 0))
) TABLESPACE pg_default;

create trigger trigger_update_manifiestos_residuos_updated_at BEFORE
update on manifiestos_residuos for EACH row
execute FUNCTION update_manifiestos_residuos_updated_at ();


create table public.personas (
  id bigserial not null,
  nombre text not null,
  tipo_persona_id bigint null,
  info_contacto text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint personas_pkey primary key (id),
  constraint personas_tipo_persona_id_fkey foreign KEY (tipo_persona_id) references tipos_persona (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_personas_tipo on public.personas using btree (tipo_persona_id) TABLESPACE pg_default;

create index IF not exists idx_personas_nombre on public.personas using btree (nombre) TABLESPACE pg_default;

create trigger update_personas_updated_at BEFORE
update on personas for EACH row
execute FUNCTION update_updated_at_column ();


create table public.residuos (
  id bigserial not null,
  buque_id bigint null,
  tipo_residuo_id bigint null,
  cantidad_generada numeric(10, 2) not null,
  fecha_generacion date null default CURRENT_DATE,
  cumplimiento_id bigint null,
  estado text null default 'Generado'::text,
  ubicacion_almacenamiento text null,
  observaciones text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint residuos_pkey primary key (id),
  constraint residuos_buque_id_fkey foreign KEY (buque_id) references buques (id) on delete CASCADE,
  constraint residuos_cumplimiento_id_fkey foreign KEY (cumplimiento_id) references cumplimiento (id) on delete set null,
  constraint residuos_tipo_residuo_id_fkey foreign KEY (tipo_residuo_id) references tipos_residuos (id) on delete set null,
  constraint residuos_cantidad_generada_check check ((cantidad_generada >= (0)::numeric)),
  constraint residuos_estado_check check (
    (
      estado = any (
        array[
          'Generado'::text,
          'Almacenado'::text,
          'Recolectado'::text,
          'Procesado'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_residuos_buque on public.residuos using btree (buque_id) TABLESPACE pg_default;

create index IF not exists idx_residuos_tipo on public.residuos using btree (tipo_residuo_id) TABLESPACE pg_default;

create index IF not exists idx_residuos_cumplimiento on public.residuos using btree (cumplimiento_id) TABLESPACE pg_default;

create index IF not exists idx_residuos_fecha on public.residuos using btree (fecha_generacion) TABLESPACE pg_default;

create index IF not exists idx_residuos_estado on public.residuos using btree (estado) TABLESPACE pg_default;

create trigger update_residuos_updated_at BEFORE
update on residuos for EACH row
execute FUNCTION update_updated_at_column ();


create table public.reutilizacion_residuos (
  id bigserial not null,
  residuo_id bigint null,
  asociacion_id bigint null,
  fecha_reutilizacion date null default CURRENT_DATE,
  cantidad_reutilizada numeric(10, 2) not null,
  metodo_reutilizacion text null,
  producto_final text null,
  impacto_ambiental text null,
  costo_proceso numeric(10, 2) null,
  ingreso_generado numeric(10, 2) null,
  observaciones text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint reutilizacion_residuos_pkey primary key (id),
  constraint reutilizacion_residuos_asociacion_id_fkey foreign KEY (asociacion_id) references asociaciones_recolectoras (id) on delete set null,
  constraint reutilizacion_residuos_residuo_id_fkey foreign KEY (residuo_id) references residuos (id) on delete CASCADE,
  constraint reutilizacion_residuos_cantidad_reutilizada_check check ((cantidad_reutilizada >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_reutilizacion_fecha on public.reutilizacion_residuos using btree (fecha_reutilizacion) TABLESPACE pg_default;

create index IF not exists idx_reutilizacion_residuo on public.reutilizacion_residuos using btree (residuo_id) TABLESPACE pg_default;

create index IF not exists idx_reutilizacion_asociacion on public.reutilizacion_residuos using btree (asociacion_id) TABLESPACE pg_default;

create trigger update_reutilizacion_residuos_updated_at BEFORE
update on reutilizacion_residuos for EACH row
execute FUNCTION update_updated_at_column ();


create table public.tipos_persona (
  id bigserial not null,
  nombre_tipo text not null,
  descripcion text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint tipos_persona_pkey primary key (id),
  constraint tipos_persona_nombre_tipo_key unique (nombre_tipo)
) TABLESPACE pg_default;

create trigger update_tipos_persona_updated_at BEFORE
update on tipos_persona for EACH row
execute FUNCTION update_updated_at_column ();


create table public.tipos_residuos (
  id bigserial not null,
  nombre_tipo text not null,
  metrica text null default 'kg'::text,
  descripcion text null,
  categoria text null,
  peligrosidad text null default 'Baja'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint tipos_residuos_pkey primary key (id),
  constraint tipos_residuos_nombre_tipo_key unique (nombre_tipo),
  constraint tipos_residuos_peligrosidad_check check (
    (
      peligrosidad = any (array['Baja'::text, 'Media'::text, 'Alta'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tipos_residuos_categoria on public.tipos_residuos using btree (categoria) TABLESPACE pg_default;

create index IF not exists idx_tipos_residuos_peligrosidad on public.tipos_residuos using btree (peligrosidad) TABLESPACE pg_default;

create trigger update_tipos_residuos_updated_at BEFORE
update on tipos_residuos for EACH row
execute FUNCTION update_updated_at_column ();


create table public.usuarios_sistema (
  id bigserial not null,
  nombre_usuario text not null,
  rol text null default 'Usuario'::text,
  contacto_usuario text null,
  email text not null,
  hash_contraseña text not null,
  estado text null default 'Activo'::text,
  ultimo_acceso timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint usuarios_sistema_pkey primary key (id),
  constraint usuarios_sistema_email_key unique (email),
  constraint usuarios_sistema_nombre_usuario_key unique (nombre_usuario),
  constraint usuarios_sistema_estado_check check (
    (
      estado = any (
        array[
          'Activo'::text,
          'Inactivo'::text,
          'Suspendido'::text
        ]
      )
    )
  ),
  constraint usuarios_sistema_rol_check check (
    (
      rol = any (
        array[
          'Administrador'::text,
          'Usuario'::text,
          'Supervisor'::text,
          'Inspector'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_usuarios_email on public.usuarios_sistema using btree (email) TABLESPACE pg_default;

create index IF not exists idx_usuarios_rol on public.usuarios_sistema using btree (rol) TABLESPACE pg_default;

create trigger update_usuarios_sistema_updated_at BEFORE
update on usuarios_sistema for EACH row
execute FUNCTION update_updated_at_column ();
