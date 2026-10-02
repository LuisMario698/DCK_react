import { createClient } from '@/lib/supabase/client'
import { traerTodas } from '@/lib/supabase/paginar'
import { Notificacion, Recoleccion, SolicitudConAsociacion, SolicitudRecoleccion } from '@/types/database'
import { TIPOS_RESIDUO, TIPO_RESIDUO_LABEL, type EstadoSolicitud, type TipoResiduo } from '@/lib/constants/residuos'

const SELECT_CON_ASOCIACION =
  '*, asociacion:asociaciones_recolectoras(id, nombre_asociacion, ubicacion, email, telefono, rfc, estado), recoleccion:recolecciones(folio, cantidad, fecha)'

function normalizar<T extends SolicitudRecoleccion>(s: T): T {
  const base = {
    ...s,
    cantidad_solicitada: Number(s.cantidad_solicitada),
    cantidad_aprobada: s.cantidad_aprobada === null ? null : Number(s.cantidad_aprobada),
  }
  if (!('recoleccion' in s)) return base
  // Relación 1:1 (solicitud_id es único); según la versión de PostgREST llega como objeto o arreglo
  const r = (s as { recoleccion?: unknown }).recoleccion
  const rec = (Array.isArray(r) ? r[0] : r) as { folio: string; cantidad: number; fecha: string } | null | undefined
  return { ...base, recoleccion: rec ? { folio: rec.folio, cantidad: Number(rec.cantidad), fecha: rec.fecha } : null }
}

/** Cantidad a mostrar: la recolectada si ya se completó, si no la aprobada o la solicitada. */
export function cantidadVigente(s: SolicitudConAsociacion): number {
  return s.recoleccion?.cantidad ?? s.cantidad_aprobada ?? s.cantidad_solicitada
}

/**
 * Lista solicitudes. El admin ve todas; el recolector sólo las de su
 * asociación (RLS).
 */
export async function getSolicitudes(filtros: { estado?: EstadoSolicitud; asociacionId?: number } = {}) {
  const supabase = createClient()

  // Todas, por páginas de 1,000 (Supabase corta cada respuesta en 1,000 filas)
  const data = await traerTodas((desde, hasta) => {
    let query = supabase
      .from('solicitudes_recoleccion')
      .select(SELECT_CON_ASOCIACION)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
    if (filtros.estado) query = query.eq('estado', filtros.estado)
    if (filtros.asociacionId) query = query.eq('asociacion_id', filtros.asociacionId)
    return query.range(desde, hasta)
  })
  return (data as SolicitudConAsociacion[]).map(normalizar)
}

export async function contarSolicitudesPendientes() {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('solicitudes_recoleccion')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  if (error) throw error
  return count ?? 0
}

/**
 * La solicitud de la que habla un aviso del recinto, para abrirla directo. Los avisos no guardan su
 * id, pero la base los crea en la misma transacción que el cambio (trigger
 * `notificar_cambio_solicitud`) y `now()` no cambia dentro de una transacción: el aviso
 * "nueva_solicitud" tiene la misma hora que el `created_at` de la solicitud y "cancelada", la
 * misma que su `updated_at` (lo pone el trigger de updated_at; una cancelada ya no cambia).
 * null si no es un aviso de solicitud o no se encuentra.
 */
export async function buscarSolicitudDeAviso(aviso: Pick<Notificacion, 'tipo' | 'asociacion_id' | 'created_at'>): Promise<number | null> {
  const columna = aviso.tipo === 'nueva_solicitud' ? 'created_at' : aviso.tipo === 'cancelada' ? 'updated_at' : null
  if (!columna || !aviso.asociacion_id) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('solicitudes_recoleccion')
    .select('id')
    .eq('asociacion_id', aviso.asociacion_id)
    .eq(columna, aviso.created_at)
    .limit(1)

  if (error) throw error
  return (data?.[0]?.id as number | undefined) ?? null
}

// Estados en los que puede estar hoy una solicitud de la que habló un aviso
const ESTADOS_DEL_AVISO: Partial<Record<Notificacion['tipo'], EstadoSolicitud[]>> = {
  nueva_solicitud: ['pendiente', 'aprobada', 'completada', 'rechazada', 'cancelada'],
  aprobada: ['aprobada', 'completada'],
  rechazada: ['rechazada'],
  completada: ['completada'],
  cancelada: ['cancelada'],
}

/**
 * La solicitud de la que habla un aviso del portal, buscada entre las que la empresa ya tiene
 * cargadas (sin otra consulta). El aviso se crea en la misma transacción que el cambio, así que su
 * hora es la del `updated_at` (y `resuelta_at`) de la solicitud en ese momento. Si después la
 * solicitud cambió otra vez (aprobada y luego completada), esa hora ya no está: entonces se toma la
 * más reciente del mismo residuo ("100 L de aceite usado") creada antes del aviso y en un estado
 * compatible. null si el aviso no es de una solicitud o no se encuentra.
 */
export function solicitudDelAviso(
  aviso: Pick<Notificacion, 'tipo' | 'detalle' | 'created_at'>,
  solicitudes: SolicitudRecoleccion[]
): number | null {
  const estados = ESTADOS_DEL_AVISO[aviso.tipo]
  if (!estados) return null
  const hora = new Date(aviso.created_at).getTime()
  const misma = (t: string | null) => t !== null && new Date(t).getTime() === hora

  const exacta = solicitudes.find((s) => misma(s.updated_at) || misma(s.resuelta_at) || misma(s.created_at))
  if (exacta) return exacta.id

  const detalle = (aviso.detalle ?? '').toLowerCase()
  const tipo = TIPOS_RESIDUO.find((t) => detalle.includes(' de ' + TIPO_RESIDUO_LABEL[t].toLowerCase()))
  const candidatas = solicitudes
    .filter((s) => (!tipo || s.tipo === tipo) && estados.includes(s.estado) && new Date(s.created_at).getTime() <= hora)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  return candidatas[0]?.id ?? null
}

// ── Acciones (todas pasan por funciones RPC que validan rol e inventario) ──

export async function crearSolicitud(datos: {
  tipo: TipoResiduo
  cantidad: number
  fechaPropuesta: string
  mensaje?: string
}) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('crear_solicitud', {
    p_tipo: datos.tipo,
    p_cantidad: datos.cantidad,
    p_fecha_propuesta: datos.fechaPropuesta,
    p_mensaje: datos.mensaje ?? null,
  })

  if (error) throw error
  return normalizar(data as SolicitudRecoleccion)
}

export async function aprobarSolicitud(id: number, cantidad?: number) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('aprobar_solicitud', {
    p_id: id,
    p_cantidad: cantidad ?? null,
  })

  if (error) throw error
  return normalizar(data as SolicitudRecoleccion)
}

export async function rechazarSolicitud(id: number, motivo: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('rechazar_solicitud', { p_id: id, p_motivo: motivo })
  if (error) throw error
  return normalizar(data as SolicitudRecoleccion)
}

export async function cancelarSolicitud(id: number) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('cancelar_solicitud', { p_id: id })
  if (error) throw error
  return normalizar(data as SolicitudRecoleccion)
}

export async function completarSolicitud(
  id: number,
  datos: { cantidadReal: number; entregadoPor?: string; recibidoPor?: string; observaciones?: string }
) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('completar_solicitud', {
    p_id: id,
    p_cantidad_real: datos.cantidadReal,
    p_entregado_por: datos.entregadoPor ?? null,
    p_recibido_por: datos.recibidoPor ?? null,
    p_observaciones: datos.observaciones ?? null,
  })

  if (error) throw error
  const rec = data as Recoleccion
  return { ...rec, cantidad: Number(rec.cantidad) }
}
