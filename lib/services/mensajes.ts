import { createClient } from '@/lib/supabase/client'
import { Mensaje } from '@/types/database'

/** Mensajes de una conversación (una por asociación), del más antiguo al más nuevo. */
export async function getMensajes(asociacionId: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .eq('asociacion_id', asociacionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Mensaje[]
}

export interface ResumenConversacion {
  asociacion_id: number
  ultimo: Mensaje | null
  noLeidos: number
}

/**
 * Resumen de conversaciones para el admin: último mensaje y no leídos que
 * envió cada asociación.
 */
export async function getResumenConversaciones(): Promise<ResumenConversacion[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error

  const porAsociacion = new Map<number, ResumenConversacion>()
  for (const m of data as Mensaje[]) {
    const r = porAsociacion.get(m.asociacion_id) ?? { asociacion_id: m.asociacion_id, ultimo: null, noLeidos: 0 }
    r.ultimo = m
    if (m.autor_rol === 'recolector' && !m.leido_at) r.noLeidos++
    porAsociacion.set(m.asociacion_id, r)
  }
  return [...porAsociacion.values()]
}

/** No leídos para el usuario actual (mensajes que envió la otra parte). */
export async function contarMensajesNoLeidos(deRol: 'admin' | 'recolector') {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('mensajes')
    .select('id', { count: 'exact', head: true })
    .eq('autor_rol', deRol)
    .is('leido_at', null)

  if (error) throw error
  return count ?? 0
}

/** El autor y su rol los asigna la base de datos a partir de la sesión. */
export async function enviarMensaje(asociacionId: number, texto: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('mensajes')
    .insert({ asociacion_id: asociacionId, texto })
    .select()
    .single()

  if (error) throw error
  return data as Mensaje
}

export async function marcarMensajesLeidos(asociacionId: number) {
  const supabase = createClient()

  const { error } = await supabase.rpc('marcar_mensajes_leidos', { p_asociacion_id: asociacionId })
  if (error) throw error
}

/**
 * Escucha mensajes nuevos en tiempo real. Sin `asociacionId` escucha todas las
 * conversaciones visibles (admin). Devuelve la función para desuscribirse.
 */
export function suscribirMensajes(onNuevo: (m: Mensaje) => void, asociacionId?: number) {
  const supabase = createClient()

  const canal = supabase
    .channel(`mensajes-${asociacionId ?? 'todos'}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        ...(asociacionId ? { filter: `asociacion_id=eq.${asociacionId}` } : {}),
      },
      (payload) => onNuevo(payload.new as Mensaje)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(canal)
  }
}
