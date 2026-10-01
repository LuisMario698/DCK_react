// Tipos basados en la estructura de base de datos de Supabase
import type { EstadoSolicitud, TipoResiduo, UnidadResiduo } from '@/lib/constants/residuos';
import type { CicloSuscripcion, EstadoSuscripcion, MetodoPago } from '@/lib/constants/suscripciones';

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
  rfc: string | null;
  descripcion: string | null;
  sitio_web: string | null;
  ubicacion: string | null;
  tipos_residuo: TipoResiduo[];
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
  responsable_liquidos_id?: number | null;
  imagen_manifiesto_url: string | null;
  pdf_manifiesto_url: string | null;
  estado_digitalizacion: 'pendiente' | 'en_proceso' | 'completado';
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
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManifiestoBasuron {
  id: number;
  fecha: string;
  peso_entrada: number;
  peso_salida: number | null;
  total_depositado: number | null;
  /** Opcional: el recibo del basurón puede no ser de una embarcación */
  buque_id: number | null;
  observaciones: string | null;
  created_at: string | null;
  updated_at: string | null;
  hora_entrada: string | null;
  hora_salida: string | null;
  nombre_usuario: string | null;
  estado: 'En Proceso' | 'Completado' | 'Cancelado' | null;
  pdf_manifiesto_url: string | null;
  numero_ticket: string | null;
  recibimos_de: string | null;
  direccion: string | null;
  recibido_por: string | null;
}

// Tipos con relaciones para consultas JOIN
export interface PersonaConTipo extends Persona {
  tipo_persona?: TipoPersona;
}

export interface ManifiestoConRelaciones extends Manifiesto {
  buque?: Buque;
  responsable_principal?: Persona;
  responsable_secundario?: Persona;
  responsable_liquidos?: Persona;
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

// ─────────────────────────────────────────────────────────────────────
// Roles y módulo de asociaciones recolectoras (Fase 1)
// ─────────────────────────────────────────────────────────────────────

export type RolUsuario = 'admin' | 'recolector' | 'pendiente';

export interface Perfil {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  rol: RolUsuario;
  asociacion_id: number | null;
  /** Acceso al panel /superadmin. Siempre implica rol 'admin'. */
  es_superadmin: boolean;
  /** Fecha de suspensión; `null` si la cuenta está activa. */
  suspendido_at: string | null;
  motivo_suspension: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Invitacion {
  id: number;
  email: string;
  rol: 'admin' | 'recolector';
  asociacion_id: number | null;
  creada_por: string | null;
  aceptada_at: string | null;
  created_at: string;
}

export interface InventarioResiduo {
  id: number;
  tipo: TipoResiduo;
  /** Cantidad disponible para nuevas solicitudes (ya descontado lo aprobado). */
  cantidad: number;
  unidad: UnidadResiduo;
  notas: string | null;
  publicado: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface SolicitudRecoleccion {
  id: number;
  asociacion_id: number;
  tipo: TipoResiduo;
  cantidad_solicitada: number;
  cantidad_aprobada: number | null;
  unidad: UnidadResiduo;
  fecha_propuesta: string;
  mensaje: string | null;
  estado: EstadoSolicitud;
  motivo_rechazo: string | null;
  creada_por: string | null;
  resuelta_por: string | null;
  resuelta_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SolicitudConAsociacion extends SolicitudRecoleccion {
  asociacion: Pick<AsociacionRecolectora, 'id' | 'nombre_asociacion' | 'ubicacion' | 'email' | 'telefono' | 'rfc' | 'estado'> | null;
  /** Presente cuando la solicitud ya se completó. */
  recoleccion?: Pick<Recoleccion, 'folio' | 'cantidad'> | null;
}

export interface Recoleccion {
  id: number;
  folio: string;
  solicitud_id: number;
  asociacion_id: number;
  tipo: TipoResiduo;
  cantidad: number;
  unidad: UnidadResiduo;
  fecha: string;
  entregado_por: string | null;
  recibido_por: string | null;
  observaciones: string | null;
  /** Ruta dentro del bucket privado `recolecciones_pdf`. */
  comprobante_pdf_path: string | null;
  registrada_por: string | null;
  created_at: string;
}

export interface RecoleccionConAsociacion extends Recoleccion {
  asociacion: Pick<AsociacionRecolectora, 'id' | 'nombre_asociacion' | 'rfc' | 'ubicacion'> | null;
}

export interface Mensaje {
  id: number;
  asociacion_id: number;
  autor_id: string | null;
  autor_rol: 'admin' | 'recolector';
  texto: string;
  leido_at: string | null;
  created_at: string;
}

export type TipoNotificacion =
  | 'nueva_solicitud'
  | 'aprobada'
  | 'rechazada'
  | 'completada'
  | 'cancelada'
  | 'nuevo_residuo';

export interface Notificacion {
  id: number;
  destinatario: 'admin' | 'recolector';
  asociacion_id: number | null;
  tipo: TipoNotificacion;
  titulo: string;
  detalle: string | null;
  leida: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────
// Panel de superadmin: suscripciones, cuentas y configuración
// ─────────────────────────────────────────────────────────────────────

export interface Plan {
  id: number;
  nombre: string;
  descripcion: string | null;
  /** Importes en MXN. */
  precio_mensual: number;
  precio_anual: number | null;
  /** Usuarios recolectores por asociación; `null` = sin límite. */
  limite_usuarios: number | null;
  caracteristicas: string[];
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface Suscripcion {
  id: number;
  asociacion_id: number;
  plan_id: number;
  /** Estado guardado; 'vencida' se deriva de `vence_el` (ver estadoEfectivo). */
  estado: Exclude<EstadoSuscripcion, 'vencida'>;
  ciclo: CicloSuscripcion;
  precio: number;
  fecha_inicio: string;
  vence_el: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface PagoSuscripcion {
  id: number;
  suscripcion_id: number;
  monto: number;
  fecha_pago: string;
  metodo: MetodoPago;
  referencia: string | null;
  cubre_hasta: string | null;
  notas: string | null;
  registrado_por: string | null;
  created_at: string;
}

/** Fila de la RPC `sa_listar_usuarios()` (auth.users + profiles). */
export interface CuentaUsuario {
  id: string;
  email: string;
  full_name: string | null;
  rol: RolUsuario;
  asociacion_id: number | null;
  asociacion_nombre: string | null;
  es_superadmin: boolean;
  suspendido_at: string | null;
  motivo_suspension: string | null;
  creado_at: string;
  ultimo_acceso: string | null;
  correo_confirmado: boolean;
}

export interface EntradaAuditoria {
  id: number;
  tabla: string;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  registro_id: string | null;
  datos_ant: Record<string, unknown> | null;
  datos_nue: Record<string, unknown> | null;
  usuario_email: string | null;
  created_at: string;
}
