import { createClient } from '@/lib/supabase/client'
import { AsociacionRecolectora, Invitacion, Perfil } from '@/types/database'
import type { TipoResiduo } from '@/lib/constants/residuos'

export type AsociacionInput = Omit<AsociacionRecolectora, 'id' | 'created_at' | 'updated_at'>

export async function getAsociaciones() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asociaciones_recolectoras')
    .select('*')
    .order('nombre_asociacion')

  if (error) throw error
  return data as AsociacionRecolectora[]
}

export async function getAsociacionById(id: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asociaciones_recolectoras')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as AsociacionRecolectora
}

export async function createAsociacion(asociacion: AsociacionInput) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asociaciones_recolectoras')
    .insert(asociacion)
    .select()
    .single()

  if (error) throw error
  return data as AsociacionRecolectora
}

export async function updateAsociacion(id: number, asociacion: Partial<AsociacionRecolectora>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asociaciones_recolectoras')
    .update(asociacion)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as AsociacionRecolectora
}

export async function deleteAsociacion(id: number) {
  const supabase = createClient()

  const { error } = await supabase
    .from('asociaciones_recolectoras')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Buscar asociaciones
export async function searchAsociaciones(searchTerm: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asociaciones_recolectoras')
    .select('*')
    .ilike('nombre_asociacion', `%${searchTerm}%`)
    .order('nombre_asociacion')

  if (error) throw error
  return data as AsociacionRecolectora[]
}

// Filtrar por estado
export async function getAsociacionesByEstado(estado: 'Activo' | 'Inactivo' | 'Suspendido') {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asociaciones_recolectoras')
    .select('*')
    .eq('estado', estado)
    .order('nombre_asociacion')

  if (error) throw error
  return data as AsociacionRecolectora[]
}

// Filtrar por tipo
export async function getAsociacionesByTipo(tipo: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asociaciones_recolectoras')
    .select('*')
    .eq('tipo_asociacion', tipo)
    .order('nombre_asociacion')

  if (error) throw error
  return data as AsociacionRecolectora[]
}

// ─────────────────────────────────────────────────────────────────────
// Usuarios de una asociación e invitaciones (sólo admin)
// ─────────────────────────────────────────────────────────────────────

export async function getUsuariosAsociacion(asociacionId: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('asociacion_id', asociacionId)
    .eq('rol', 'recolector')
    .order('email')

  if (error) throw error
  return data as Perfil[]
}

export async function getInvitacionesPendientes(asociacionId: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('invitaciones')
    .select('*')
    .eq('asociacion_id', asociacionId)
    .is('aceptada_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Invitacion[]
}

export async function cancelarInvitacion(id: number) {
  const supabase = createClient()

  const { error } = await supabase.from('invitaciones').delete().eq('id', id)
  if (error) throw error
}

/**
 * Vincula un correo a una asociación. Devuelve 'vinculado' si el correo ya
 * tenía cuenta (acceso inmediato) o 'invitado' si queda pendiente de registro.
 */
export async function invitarUsuario(email: string, asociacionId: number) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('invitar_usuario', {
    p_email: email,
    p_rol: 'recolector',
    p_asociacion_id: asociacionId,
  })

  if (error) throw error
  return data as 'vinculado' | 'invitado'
}

export async function revocarAcceso(usuarioId: string) {
  const supabase = createClient()

  const { error } = await supabase.rpc('revocar_acceso', { p_usuario: usuarioId })
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────
// Portal recolector: datos de la propia asociación
// ─────────────────────────────────────────────────────────────────────

export interface MiAsociacionInput {
  contacto_asociacion: string | null
  email: string | null
  telefono: string | null
  direccion: string | null
  ubicacion: string | null
  sitio_web: string | null
  descripcion: string | null
  tipos_residuo: TipoResiduo[]
}

export async function actualizarMiAsociacion(datos: MiAsociacionInput) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('actualizar_mi_asociacion', {
    p_contacto: datos.contacto_asociacion,
    p_email: datos.email,
    p_telefono: datos.telefono,
    p_direccion: datos.direccion,
    p_ubicacion: datos.ubicacion,
    p_sitio_web: datos.sitio_web,
    p_descripcion: datos.descripcion,
    p_tipos_residuo: datos.tipos_residuo,
  })

  if (error) throw error
  return data as AsociacionRecolectora
}
