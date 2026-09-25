import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AsociacionRecolectora, Perfil } from '@/types/database'

export interface PerfilConAsociacion extends Perfil {
  asociacion: AsociacionRecolectora | null
}

/** Perfil del usuario con sesión (rol + asociación). `null` si no hay sesión. */
export async function getMiPerfil(client?: SupabaseClient): Promise<PerfilConAsociacion | null> {
  const supabase = client ?? createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*, asociacion:asociaciones_recolectoras(*)')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data as PerfilConAsociacion | null
}

/** Cambia la contraseña verificando antes la actual. */
export async function cambiarContrasena(email: string, actual: string, nueva: string) {
  const supabase = createClient()

  const { error: authError } = await supabase.auth.signInWithPassword({ email, password: actual })
  if (authError) throw new Error('La contraseña actual no es correcta.')

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) throw error
}
