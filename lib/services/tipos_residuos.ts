import { createClient } from '@/lib/supabase/client'
import { TipoResiduo } from '@/types/database'

export async function getTiposResiduos() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tipos_residuos')
    .select('*')
    .order('nombre_tipo')
  
  if (error) throw error
  return data as TipoResiduo[]
}

export async function getTipoResiduoById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tipos_residuos')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as TipoResiduo
}

export async function createTipoResiduo(tipo: Omit<TipoResiduo, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tipos_residuos')
    .insert(tipo)
    .select()
    .single()
  
  if (error) throw error
  return data as TipoResiduo
}

export async function updateTipoResiduo(id: number, tipo: Partial<TipoResiduo>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tipos_residuos')
    .update(tipo)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as TipoResiduo
}

export async function deleteTipoResiduo(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('tipos_residuos')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Filtrar por categoría
export async function getTiposResiduosByCategoria(categoria: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tipos_residuos')
    .select('*')
    .eq('categoria', categoria)
    .order('nombre_tipo')
  
  if (error) throw error
  return data as TipoResiduo[]
}

// Filtrar por peligrosidad
export async function getTiposResiduosByPeligrosidad(peligrosidad: 'Baja' | 'Media' | 'Alta') {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tipos_residuos')
    .select('*')
    .eq('peligrosidad', peligrosidad)
    .order('nombre_tipo')
  
  if (error) throw error
  return data as TipoResiduo[]
}
