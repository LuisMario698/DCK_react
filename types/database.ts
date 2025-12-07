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
  registro_completo: boolean;
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
  registro_completo: boolean;
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
  filtros_aire: number;
  basura: number;
  created_at: string;
  updated_at: string;
}

export interface ManifiestoBasuron {
  id: number;
  fecha: string;
  peso_entrada: number;
  peso_salida: number | null;
  total_depositado: number | null;
  buque_id: number;
  observaciones: string | null;
  created_at: string | null;
  updated_at: string | null;
  hora_entrada: string | null;
  hora_salida: string | null;
  nombre_usuario: string | null;
  estado: 'En Proceso' | 'Completado' | 'Cancelado' | null;
  usuario_sistema_id: number | null;
  tipo_residuo_id: number | null;
  comprobante_url: string | null;
}

// Tipos con relaciones para consultas JOIN
export interface PersonaConTipo extends Persona {
  tipo_persona?: TipoPersona;
}

export interface ManifiestoConRelaciones extends Manifiesto {
  buque?: Buque;
  responsable_principal?: Persona;
  responsable_secundario?: Persona;
  residuos?: ManifiestoResiduo;
}

export interface ManifiestoBasuronConRelaciones extends ManifiestoBasuron {
  buque?: Buque;
}

export interface ManifiestoNoFirmado {
  id: number;
  manifiesto_id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  url_descarga: string | null;
  numero_manifiesto: string;
  fecha_generacion: string;
  estado: 'pendiente' | 'descargado' | 'firmado' | 'cancelado';
  descargado_en: string | null;
  descargado_por: string | null;
  firmado_en: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManifiestoNoFirmadoConRelaciones extends ManifiestoNoFirmado {
  manifiesto?: ManifiestoConRelaciones;
}
