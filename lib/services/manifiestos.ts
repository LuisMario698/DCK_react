import { createClient } from '@/lib/supabase/client'
import { Manifiesto, ManifiestoConRelaciones } from '@/types/database'

export async function getManifiestos() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiestos')
    .select(`
      *,
      buque:buques(nombre_buque),
      generador:personas!manifiestos_generador_id_fkey(nombre),
      transportista:personas!manifiestos_transportista_id_fkey(nombre),
      receptor:personas!manifiestos_receptor_id_fkey(nombre)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as ManifiestoConRelaciones[]
}

export async function getManifiestoById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiestos')
    .select(`
      *,
      buque:buques(nombre_buque),
      generador:personas!manifiestos_generador_id_fkey(nombre),
      transportista:personas!manifiestos_transportista_id_fkey(nombre),
      receptor:personas!manifiestos_receptor_id_fkey(nombre)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ManifiestoConRelaciones
}

export async function createManifiesto(manifiesto: Omit<Manifiesto, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiestos')
    .insert(manifiesto)
    .select()
    .single()
  
  if (error) throw error
  return data as Manifiesto
}

export async function updateManifiesto(id: number, manifiesto: Partial<Manifiesto>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiestos')
    .update(manifiesto)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Manifiesto
}

export async function deleteManifiesto(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('manifiestos')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function getManifiestosByEstado(estado: 'pendiente' | 'en_proceso' | 'completado') {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiestos')
    .select('*')
    .eq('estado_digitalizacion', estado)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Manifiesto[]
}

export async function getManifiestosByBuque(buqueId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiestos')
    .select('*')
    .eq('buque_id', buqueId)
    .order('fecha_emision', { ascending: false })
  
  if (error) throw error
  return data as Manifiesto[]
}
