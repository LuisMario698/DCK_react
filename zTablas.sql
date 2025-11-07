-- ============================================
-- SISTEMA DE GESTIÓN DE RESIDUOS MARÍTIMOS
-- Script de creación de tablas para Supabase
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA: tipos_persona (person_types)
-- ============================================
CREATE TABLE IF NOT EXISTS tipos_persona (
    id BIGSERIAL PRIMARY KEY,
    nombre_tipo TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar tipos de persona por defecto
INSERT INTO tipos_persona (nombre_tipo, descripcion) VALUES
    ('Capitán', 'Capitán de embarcación'),
    ('Tripulante', 'Miembro de la tripulación'),
    ('Inspector', 'Inspector de cumplimiento'),
    ('Administrativo', 'Personal administrativo'),
    ('Propietario', 'Propietario de embarcación')
ON CONFLICT (nombre_tipo) DO NOTHING;

-- ============================================
-- 2. TABLA: personas (persons)
-- ============================================
CREATE TABLE IF NOT EXISTS personas (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo_persona_id BIGINT REFERENCES tipos_persona(id) ON DELETE SET NULL,
    info_contacto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para personas
CREATE INDEX IF NOT EXISTS idx_personas_tipo ON personas(tipo_persona_id);
CREATE INDEX IF NOT EXISTS idx_personas_nombre ON personas(nombre);

-- ============================================
-- 3. TABLA: buques (vessels)
-- ============================================
CREATE TABLE IF NOT EXISTS buques (
    id BIGSERIAL PRIMARY KEY,
    nombre_buque TEXT NOT NULL,
    tipo_buque TEXT,
    propietario_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    matricula TEXT UNIQUE,
    puerto_base TEXT,
    capacidad_toneladas NUMERIC(10, 2),
    estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'En Mantenimiento')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para buques
CREATE INDEX IF NOT EXISTS idx_buques_propietario ON buques(propietario_id);
CREATE INDEX IF NOT EXISTS idx_buques_tipo ON buques(tipo_buque);
CREATE INDEX IF NOT EXISTS idx_buques_estado ON buques(estado);

-- ============================================
-- 4. TABLA: tipos_residuos (waste_types)
-- ============================================
CREATE TABLE IF NOT EXISTS tipos_residuos (
    id BIGSERIAL PRIMARY KEY,
    nombre_tipo TEXT NOT NULL UNIQUE,
    metrica TEXT DEFAULT 'kg',
    descripcion TEXT,
    categoria TEXT, -- Orgánico, Plástico, Metal, Químico, etc.
    peligrosidad TEXT DEFAULT 'Baja' CHECK (peligrosidad IN ('Baja', 'Media', 'Alta')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar tipos de residuos por defecto
INSERT INTO tipos_residuos (nombre_tipo, metrica, descripcion, categoria, peligrosidad) VALUES
    ('Plástico PET', 'kg', 'Botellas y envases de plástico PET', 'Plástico', 'Baja'),
    ('Plástico HDPE', 'kg', 'Plástico de alta densidad', 'Plástico', 'Baja'),
    ('Metal - Aluminio', 'kg', 'Latas y recipientes de aluminio', 'Metal', 'Baja'),
    ('Metal - Acero', 'kg', 'Chatarra y piezas de acero', 'Metal', 'Baja'),
    ('Vidrio', 'kg', 'Botellas y envases de vidrio', 'Vidrio', 'Baja'),
    ('Orgánico', 'kg', 'Residuos orgánicos y biodegradables', 'Orgánico', 'Baja'),
    ('Aceites usados', 'litros', 'Aceites lubricantes y combustibles usados', 'Químico', 'Alta'),
    ('Baterías', 'unidades', 'Baterías y pilas usadas', 'Químico', 'Alta'),
    ('Residuos electrónicos', 'kg', 'Equipos electrónicos obsoletos', 'Electrónico', 'Media'),
    ('Papel y cartón', 'kg', 'Papel, cartón y documentos', 'Papel', 'Baja')
ON CONFLICT (nombre_tipo) DO NOTHING;

-- Índices para tipos_residuos
CREATE INDEX IF NOT EXISTS idx_tipos_residuos_categoria ON tipos_residuos(categoria);
CREATE INDEX IF NOT EXISTS idx_tipos_residuos_peligrosidad ON tipos_residuos(peligrosidad);

-- ============================================
-- 5. TABLA: usuarios_sistema (system_users)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id BIGSERIAL PRIMARY KEY,
    nombre_usuario TEXT NOT NULL UNIQUE,
    rol TEXT DEFAULT 'Usuario' CHECK (rol IN ('Administrador', 'Usuario', 'Supervisor', 'Inspector')),
    contacto_usuario TEXT,
    email TEXT UNIQUE NOT NULL,
    hash_contraseña TEXT NOT NULL,
    estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido')),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para usuarios_sistema
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios_sistema(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios_sistema(rol);

-- ============================================
-- 6. TABLA: cumplimiento (compliance)
-- ============================================
CREATE TABLE IF NOT EXISTS cumplimiento (
    id BIGSERIAL PRIMARY KEY,
    buque_id BIGINT REFERENCES buques(id) ON DELETE CASCADE,
    fecha_inspeccion DATE DEFAULT CURRENT_DATE,
    observaciones TEXT,
    usuario_sistema_id BIGINT REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    calificacion TEXT CHECK (calificacion IN ('Excelente', 'Bueno', 'Regular', 'Deficiente')),
    estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado')),
    documento_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cumplimiento
CREATE INDEX IF NOT EXISTS idx_cumplimiento_buque ON cumplimiento(buque_id);
CREATE INDEX IF NOT EXISTS idx_cumplimiento_usuario ON cumplimiento(usuario_sistema_id);
CREATE INDEX IF NOT EXISTS idx_cumplimiento_fecha ON cumplimiento(fecha_inspeccion);
CREATE INDEX IF NOT EXISTS idx_cumplimiento_estado ON cumplimiento(estado);

-- ============================================
-- 7. TABLA: residuos (waste)
-- ============================================
CREATE TABLE IF NOT EXISTS residuos (
    id BIGSERIAL PRIMARY KEY,
    buque_id BIGINT REFERENCES buques(id) ON DELETE CASCADE,
    tipo_residuo_id BIGINT REFERENCES tipos_residuos(id) ON DELETE SET NULL,
    cantidad_generada NUMERIC(10, 2) NOT NULL CHECK (cantidad_generada >= 0),
    fecha_generacion DATE DEFAULT CURRENT_DATE,
    cumplimiento_id BIGINT REFERENCES cumplimiento(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'Generado' CHECK (estado IN ('Generado', 'Almacenado', 'Recolectado', 'Procesado')),
    ubicacion_almacenamiento TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para residuos
CREATE INDEX IF NOT EXISTS idx_residuos_buque ON residuos(buque_id);
CREATE INDEX IF NOT EXISTS idx_residuos_tipo ON residuos(tipo_residuo_id);
CREATE INDEX IF NOT EXISTS idx_residuos_cumplimiento ON residuos(cumplimiento_id);
CREATE INDEX IF NOT EXISTS idx_residuos_fecha ON residuos(fecha_generacion);
CREATE INDEX IF NOT EXISTS idx_residuos_estado ON residuos(estado);

-- ============================================
-- 8. TABLA: asociaciones_recolectoras (collector_associations)
-- ============================================
CREATE TABLE IF NOT EXISTS asociaciones_recolectoras (
    id BIGSERIAL PRIMARY KEY,
    nombre_asociacion TEXT NOT NULL UNIQUE,
    tipo_asociacion TEXT,
    contacto_asociacion TEXT,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    certificaciones TEXT[], -- Array de certificaciones
    especialidad TEXT[], -- Tipos de residuos que manejan
    estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para asociaciones_recolectoras
CREATE INDEX IF NOT EXISTS idx_asociaciones_tipo ON asociaciones_recolectoras(tipo_asociacion);
CREATE INDEX IF NOT EXISTS idx_asociaciones_estado ON asociaciones_recolectoras(estado);

-- ============================================
-- 9. TABLA: reutilizacion_residuos (waste_reutilization)
-- ============================================
CREATE TABLE IF NOT EXISTS reutilizacion_residuos (
    id BIGSERIAL PRIMARY KEY,
    residuo_id BIGINT REFERENCES residuos(id) ON DELETE CASCADE,
    asociacion_id BIGINT REFERENCES asociaciones_recolectoras(id) ON DELETE SET NULL,
    fecha_reutilizacion DATE DEFAULT CURRENT_DATE,
    cantidad_reutilizada NUMERIC(10, 2) NOT NULL CHECK (cantidad_reutilizada >= 0),
    metodo_reutilizacion TEXT, -- Reciclaje, Compostaje, Reutilización directa, etc.
    producto_final TEXT, -- Qué se generó a partir del residuo
    impacto_ambiental TEXT,
    costo_proceso NUMERIC(10, 2),
    ingreso_generado NUMERIC(10, 2),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para reutilizacion_residuos
CREATE INDEX IF NOT EXISTS idx_reutilizacion_residuo ON reutilizacion_residuos(residuo_id);
CREATE INDEX IF NOT EXISTS idx_reutilizacion_asociacion ON reutilizacion_residuos(asociacion_id);
CREATE INDEX IF NOT EXISTS idx_reutilizacion_fecha ON reutilizacion_residuos(fecha_reutilizacion);

-- ============================================
-- 10. TABLA: manifiestos (manifests) - NUEVA
-- ============================================
CREATE TABLE IF NOT EXISTS manifiestos (
    id BIGSERIAL PRIMARY KEY,
    buque_id BIGINT REFERENCES buques(id) ON DELETE CASCADE,
    persona_responsable_id BIGINT REFERENCES personas(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_manifiesto TEXT UNIQUE,
    estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'Completado', 'Aprobado', 'Rechazado')),
    tipo_manifiesto TEXT, -- Carga, Tripulación, Pasajeros, Residuos
    observaciones TEXT,
    documento_url TEXT,
    
    -- Proceso de digitalización
    paso_actual INTEGER DEFAULT 1 CHECK (paso_actual BETWEEN 1 AND 4),
    digitalizacion_completada BOOLEAN DEFAULT false,
    fecha_digitalizacion TIMESTAMP WITH TIME ZONE,
    
    -- Validación
    validado BOOLEAN DEFAULT false,
    validado_por_id BIGINT REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    fecha_validacion TIMESTAMP WITH TIME ZONE,
    
    -- Aprobación
    aprobado BOOLEAN DEFAULT false,
    aprobado_por_id BIGINT REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para manifiestos
CREATE INDEX IF NOT EXISTS idx_manifiestos_buque ON manifiestos(buque_id);
CREATE INDEX IF NOT EXISTS idx_manifiestos_responsable ON manifiestos(persona_responsable_id);
CREATE INDEX IF NOT EXISTS idx_manifiestos_estado ON manifiestos(estado);
CREATE INDEX IF NOT EXISTS idx_manifiestos_numero ON manifiestos(numero_manifiesto);

-- ============================================
-- 11. TABLA: manifiesto_basuron (waste_dump_manifest)
-- ============================================
CREATE TABLE IF NOT EXISTS manifiesto_basuron (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE NOT NULL,
    hora_entrada TIME NOT NULL,
    hora_salida TIME,
    peso_entrada NUMERIC(10, 2) NOT NULL CHECK (peso_entrada >= 0),
    peso_salida NUMERIC(10, 2) CHECK (peso_salida >= 0),
    total_depositado NUMERIC(10, 2) GENERATED ALWAYS AS (peso_entrada - COALESCE(peso_salida, 0)) STORED,
    observaciones TEXT,
    buque_id BIGINT REFERENCES buques(id) ON DELETE CASCADE NOT NULL,
    usuario_sistema_id BIGINT REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'En Proceso' CHECK (estado IN ('En Proceso', 'Completado', 'Cancelado')),
    numero_ticket TEXT UNIQUE,
    tipo_residuo_id BIGINT REFERENCES tipos_residuos(id) ON DELETE SET NULL,
    comprobante_url TEXT, -- URL del comprobante o ticket escaneado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para manifiesto_basuron
CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_fecha ON manifiesto_basuron(fecha);
CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_buque ON manifiesto_basuron(buque_id);
CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_usuario ON manifiesto_basuron(usuario_sistema_id);
CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_estado ON manifiesto_basuron(estado);
CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_ticket ON manifiesto_basuron(numero_ticket);

-- Trigger para generar número de ticket automáticamente
CREATE OR REPLACE FUNCTION generar_numero_ticket()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_ticket IS NULL THEN
        NEW.numero_ticket := 'TKT-' || TO_CHAR(NEW.fecha, 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_numero_ticket
    BEFORE INSERT ON manifiesto_basuron
    FOR EACH ROW
    EXECUTE FUNCTION generar_numero_ticket();

-- ============================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- ============================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabla
CREATE TRIGGER update_tipos_persona_updated_at BEFORE UPDATE ON tipos_persona
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buques_updated_at BEFORE UPDATE ON buques
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_residuos_updated_at BEFORE UPDATE ON tipos_residuos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_sistema_updated_at BEFORE UPDATE ON usuarios_sistema
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cumplimiento_updated_at BEFORE UPDATE ON cumplimiento
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_residuos_updated_at BEFORE UPDATE ON residuos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asociaciones_recolectoras_updated_at BEFORE UPDATE ON asociaciones_recolectoras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reutilizacion_residuos_updated_at BEFORE UPDATE ON reutilizacion_residuos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manifiestos_updated_at BEFORE UPDATE ON manifiestos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manifiesto_basuron_updated_at BEFORE UPDATE ON manifiesto_basuron
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de residuos por buque
CREATE OR REPLACE VIEW vista_residuos_por_buque AS
SELECT 
    b.id AS buque_id,
    b.nombre_buque,
    tr.nombre_tipo AS tipo_residuo,
    SUM(r.cantidad_generada) AS cantidad_total,
    tr.metrica,
    COUNT(r.id) AS registros,
    MAX(r.fecha_generacion) AS ultima_generacion
FROM residuos r
JOIN buques b ON r.buque_id = b.id
JOIN tipos_residuos tr ON r.tipo_residuo_id = tr.id
GROUP BY b.id, b.nombre_buque, tr.nombre_tipo, tr.metrica;

-- Vista: Estadísticas de reutilización
CREATE OR REPLACE VIEW vista_estadisticas_reutilizacion AS
SELECT 
    ar.nombre_asociacion,
    COUNT(rr.id) AS total_reutilizaciones,
    SUM(rr.cantidad_reutilizada) AS cantidad_total_reutilizada,
    SUM(rr.ingreso_generado) AS ingreso_total,
    AVG(rr.costo_proceso) AS costo_promedio
FROM reutilizacion_residuos rr
JOIN asociaciones_recolectoras ar ON rr.asociacion_id = ar.id
GROUP BY ar.nombre_asociacion;

-- Vista: Estado de cumplimiento por buque
CREATE OR REPLACE VIEW vista_cumplimiento_buques AS
SELECT 
    b.id AS buque_id,
    b.nombre_buque,
    COUNT(c.id) AS total_inspecciones,
    SUM(CASE WHEN c.estado = 'Aprobado' THEN 1 ELSE 0 END) AS aprobadas,
    SUM(CASE WHEN c.estado = 'Rechazado' THEN 1 ELSE 0 END) AS rechazadas,
    MAX(c.fecha_inspeccion) AS ultima_inspeccion
FROM buques b
LEFT JOIN cumplimiento c ON b.id = c.buque_id
GROUP BY b.id, b.nombre_buque;

-- Vista: Manifiestos de basurón por buque
CREATE OR REPLACE VIEW vista_manifiestos_basuron AS
SELECT 
    mb.id,
    mb.fecha,
    mb.numero_ticket,
    b.nombre_buque,
    b.id AS buque_id,
    mb.hora_entrada,
    mb.hora_salida,
    mb.peso_entrada,
    mb.peso_salida,
    mb.total_depositado,
    tr.nombre_tipo AS tipo_residuo,
    tr.metrica,
    us.nombre_usuario AS registrado_por,
    mb.estado,
    mb.observaciones,
    mb.created_at
FROM manifiesto_basuron mb
JOIN buques b ON mb.buque_id = b.id
LEFT JOIN tipos_residuos tr ON mb.tipo_residuo_id = tr.id
LEFT JOIN usuarios_sistema us ON mb.usuario_sistema_id = us.id
ORDER BY mb.fecha DESC, mb.hora_entrada DESC;

-- Vista: Resumen diario de depósitos en basurón
CREATE OR REPLACE VIEW vista_resumen_diario_basuron AS
SELECT 
    mb.fecha,
    COUNT(mb.id) AS total_depositos,
    SUM(mb.total_depositado) AS peso_total_depositado,
    COUNT(DISTINCT mb.buque_id) AS buques_distintos,
    AVG(mb.total_depositado) AS promedio_depositado,
    MIN(mb.hora_entrada) AS primera_entrada,
    MAX(COALESCE(mb.hora_salida, mb.hora_entrada)) AS ultima_salida
FROM manifiesto_basuron mb
WHERE mb.estado = 'Completado'
GROUP BY mb.fecha
ORDER BY mb.fecha DESC;

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Insertar un usuario administrador de ejemplo
-- NOTA: Cambiar la contraseña en producción
INSERT INTO usuarios_sistema (nombre_usuario, rol, email, hash_contraseña, contacto_usuario) VALUES
    ('admin', 'Administrador', 'admin@ciad.com', '$2a$10$ejemplo_hash_contraseña', '+506 8888-8888')
ON CONFLICT (email) DO NOTHING;

-- Insertar algunas asociaciones de ejemplo
INSERT INTO asociaciones_recolectoras (nombre_asociacion, tipo_asociacion, contacto_asociacion, email, especialidad, estado) VALUES
    ('Asociación de Recicladores del Pacífico', 'Reciclaje', '+506 2222-3333', 'info@recicladores.cr', ARRAY['Plástico', 'Metal', 'Vidrio'], 'Activo'),
    ('Cooperativa de Gestión Ambiental', 'Cooperativa', '+506 2333-4444', 'contacto@coopambiental.cr', ARRAY['Orgánico', 'Papel'], 'Activo'),
    ('Empresa de Tratamiento de Residuos Peligrosos', 'Empresa Privada', '+506 2444-5555', 'ventas@residuospeligrosos.cr', ARRAY['Aceites usados', 'Químico'], 'Activo')
ON CONFLICT (nombre_asociacion) DO NOTHING;

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS) - Row Level Security
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE tipos_persona ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE buques ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_residuos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE cumplimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE residuos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asociaciones_recolectoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE reutilizacion_residuos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifiestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifiesto_basuron ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (permitir lectura para usuarios autenticados)
-- IMPORTANTE: Ajustar según tus necesidades de seguridad

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON tipos_persona
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON personas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON buques
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON tipos_residuos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON residuos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON asociaciones_recolectoras
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON reutilizacion_residuos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON manifiestos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir lectura a todos los usuarios autenticados" ON manifiesto_basuron
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Verificar la creación de tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
