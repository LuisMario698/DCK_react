import { createClient } from '@/lib/supabase/client'
import { Notificacion } from '@/types/database'

/**
 * A quién van dirigidas. La RLS ya filtra por rol, pero un superadmin
 * vinculado a una asociación ve las de admin y las de su asociación: el
 * portal recolector pide sólo las suyas.
 */
export interface AlcanceNotificaciones {
  destinatario: 'admin' | 'recolector'
  asociacionId?: number
}

/** Notificaciones del usuario actual (la RLS filtra por rol y asociación). */
export async function getNotificaciones(limite = 50, alcance?: AlcanceNotificaciones) {
  const supabase = createClient()

  let query = supabase
    .from('notificaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite)

  if (alcance) query = query.eq('destinatario', alcance.destinatario)
  if (alcance?.asociacionId) query = query.eq('asociacion_id', alcance.asociacionId)

  const { data, error } = await query
  if (error) throw error
  return data as Notificacion[]
}

export async function contarNotificacionesNoLeidas(alcance?: AlcanceNotificaciones) {
  const supabase = createClient()

  let query = supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('leida', false)

  if (alcance) query = query.eq('destinatario', alcance.destinatario)
  if (alcance?.asociacionId) query = query.eq('asociacion_id', alcance.asociacionId)

  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

/**
 * Sin ids marca todas como leídas. Con `comoAsociacion` un superadmin marca
 * las de su asociación (portal recolector) en lugar de las de admin.
 */
export async function marcarNotificacionesLeidas(ids?: number[], comoAsociacion = false) {
  const supabase = createClient()

  const { error } = await supabase.rpc('marcar_notificaciones_leidas', {
    p_ids: ids ?? null,
    ...(comoAsociacion ? { p_como: 'recolector' } : {}),
  })
  if (error) throw error
}

/** ¿La notificación le corresponde a este alcance? (para filtrar las que llegan en vivo) */
export function perteneceAlcance(n: Notificacion, alcance: AlcanceNotificaciones) {
  return n.destinatario === alcance.destinatario && (!alcance.asociacionId || n.asociacion_id === alcance.asociacionId)
}

/** Escucha notificaciones nuevas en tiempo real. Devuelve la función para desuscribirse. */
export function suscribirNotificaciones(onNueva: (n: Notificacion) => void) {
  const supabase = createClient()

  const canal = supabase
    .channel(`notificaciones-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notificaciones' },
      (payload) => onNueva(payload.new as Notificacion)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(canal)
  }
}

/**
 * Escucha cambios en una tabla (p. ej. solicitudes o inventario) para
 * refrescar la vista. Devuelve la función para desuscribirse.
 */
export function suscribirCambios(tabla: 'solicitudes_recoleccion' | 'inventario_residuos', onCambio: () => void) {
  const supabase = createClient()

  const canal = supabase
    .channel(`${tabla}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tabla }, () => onCambio())
    .subscribe()

  return () => {
    supabase.removeChannel(canal)
  }
}
