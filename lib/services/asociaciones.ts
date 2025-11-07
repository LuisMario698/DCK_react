import { createClient } from '@/lib/supabase/client'
import { AsociacionRecolectora } from '@/types/database'

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

export async function createAsociacion(asociacion: Omit<AsociacionRecolectora, 'id' | 'created_at' | 'updated_at'>) {
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
