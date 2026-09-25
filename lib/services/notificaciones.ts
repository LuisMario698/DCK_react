import { createClient } from '@/lib/supabase/client'
import { Notificacion } from '@/types/database'

/** Notificaciones del usuario actual (la RLS filtra por rol y asociación). */
export async function getNotificaciones(limite = 50) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) throw error
  return data as Notificacion[]
}

export async function contarNotificacionesNoLeidas() {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('leida', false)

  if (error) throw error
  return count ?? 0
}

/** Sin ids marca todas como leídas. */
export async function marcarNotificacionesLeidas(ids?: number[]) {
  const supabase = createClient()

  const { error } = await supabase.rpc('marcar_notificaciones_leidas', { p_ids: ids ?? null })
  if (error) throw error
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
