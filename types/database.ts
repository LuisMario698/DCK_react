// Tipos basados en la estructura de base de datos de Supabase

export interface Buque {
  id: number;
  nombre_buque: string;
  tipo_buque: string | null;
  propietario_id: number | null;
  fecha_registro: string;
  matricula: string | null;
  puerto_base: string | null;
  capacidad_toneladas: number | null;
  estado: 'Activo' | 'Inactivo' | 'En Mantenimiento';
  created_at: string;
  updated_at: string;
}

export interface TipoResiduo {
  id: number;
  nombre_tipo: string;
  metrica: string;
  descripcion: string | null;
  categoria: string | null;
  peligrosidad: 'Baja' | 'Media' | 'Alta';
  created_at: string;
  updated_at: string;
}

export interface Residuo {
  id: number;
  buque_id: number;
  tipo_residuo_id: number | null;
  cantidad_generada: number;
  fecha_generacion: string;
  cumplimiento_id: number | null;
  estado: 'Generado' | 'Almacenado' | 'Recolectado' | 'Procesado';
  ubicacion_almacenamiento: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface AsociacionRecolectora {
  id: number;
  nombre_asociacion: string;
  tipo_asociacion: string | null;
  contacto_asociacion: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  certificaciones: string[] | null;
  especialidad: string[] | null;
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  created_at: string;
  updated_at: string;
}

export interface UsuarioSistema {
  id: number;
  nombre_usuario: string;
  rol: 'Administrador' | 'Usuario' | 'Supervisor' | 'Inspector';
  contacto_usuario: string | null;
  email: string;
  hash_contraseña: string;
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  ultimo_acceso: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cumplimiento {
  id: number;
  buque_id: number;
  fecha_inspeccion: string;
  observaciones: string | null;
  usuario_sistema_id: number | null;
  calificacion: 'Excelente' | 'Bueno' | 'Regular' | 'Deficiente' | null;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  documento_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReutilizacionResiduo {
  id: number;
  residuo_id: number;
  asociacion_id: number | null;
  fecha_reutilizacion: string;
  cantidad_reutilizada: number;
  metodo_reutilizacion: string | null;
  producto_final: string | null;
  impacto_ambiental: string | null;
  costo_proceso: number | null;
  ingreso_generado: number | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface TipoPersona {
  id: number;
  nombre_tipo: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export interface Persona {
  id: number;
  nombre: string;
  tipo_persona_id: number | null;
  info_contacto: string | null;
  created_at: string;
  updated_at: string;
}

export interface Manifiesto {
  id: number;
  numero_manifiesto: string;
  fecha_emision: string;
  buque_id: number;
  responsable_principal_id: number | null;
  responsable_secundario_id: number | null;
  imagen_manifiesto_url: string | null;
  estado_digitalizacion: 'pendiente' | 'en_proceso' | 'completado' | 'aprobado' | 'rechazado';
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManifiestoResiduo {
  id: number;
  manifiesto_id: number;
  aceite_usado: number;
  filtros_aceite: number;
  filtros_diesel: number;
  basura: number;
  created_at: string;
  updated_at: string;
}

export interface ManifiestoBasuron {
  id: number;
  fecha: string;
  hora_entrada: string;
  hora_salida: string | null;
  peso_entrada: number;
  peso_salida: number | null;
  total_depositado: number;
  observaciones: string | null;
  buque_id: number;
  usuario_sistema_id: number | null;
  estado: 'En Proceso' | 'Completado' | 'Cancelado';
  numero_ticket: string | null;
  tipo_residuo_id: number | null;
  comprobante_url: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos con relaciones para consultas JOIN
export interface ResiduoConRelaciones extends Residuo {
  buque?: Buque;
  tipo_residuo?: TipoResiduo;
  cumplimiento?: Cumplimiento;
}

export interface PersonaConTipo extends Persona {
  tipo_persona?: TipoPersona;
}

export interface ReutilizacionConRelaciones extends ReutilizacionResiduo {
  residuo?: ResiduoConRelaciones;
  asociacion?: AsociacionRecolectora;
}

export interface CumplimientoConRelaciones extends Cumplimiento {
  buque?: Buque;
  usuario_sistema?: UsuarioSistema;
}

export interface ManifiestoConRelaciones extends Manifiesto {
  buque?: Buque;
  responsable_principal?: Persona;
  responsable_secundario?: Persona;
  residuos?: ManifiestoResiduo;
}

export interface ManifiestoBasuronConRelaciones extends ManifiestoBasuron {
  buque?: Buque;
  usuario_sistema?: UsuarioSistema;
  tipo_residuo?: TipoResiduo;
}
