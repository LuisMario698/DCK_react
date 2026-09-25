import { createClient } from '@/lib/supabase/client'
import { Recoleccion, SolicitudConAsociacion, SolicitudRecoleccion } from '@/types/database'
import type { EstadoSolicitud, TipoResiduo } from '@/lib/constants/residuos'

const SELECT_CON_ASOCIACION =
  '*, asociacion:asociaciones_recolectoras(id, nombre_asociacion, ubicacion, email, telefono, rfc, estado), recoleccion:recolecciones(folio, cantidad)'

function normalizar<T extends SolicitudRecoleccion>(s: T): T {
  const base = {
    ...s,
    cantidad_solicitada: Number(s.cantidad_solicitada),
    cantidad_aprobada: s.cantidad_aprobada === null ? null : Number(s.cantidad_aprobada),
  }
  if (!('recoleccion' in s)) return base
  // Relación 1:1 (solicitud_id es único); según la versión de PostgREST llega como objeto o arreglo
  const r = (s as { recoleccion?: unknown }).recoleccion
  const rec = (Array.isArray(r) ? r[0] : r) as { folio: string; cantidad: number } | null | undefined
  return { ...base, recoleccion: rec ? { folio: rec.folio, cantidad: Number(rec.cantidad) } : null }
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

  let query = supabase
    .from('solicitudes_recoleccion')
    .select(SELECT_CON_ASOCIACION)
    .order('created_at', { ascending: false })

  if (filtros.estado) query = query.eq('estado', filtros.estado)
  if (filtros.asociacionId) query = query.eq('asociacion_id', filtros.asociacionId)

  const { data, error } = await query
  if (error) throw error
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
