import { createClient } from '@/lib/supabase/client'
import { Buque } from '@/types/database'

export async function getBuques() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buques')
    .select('*')
    .order('fecha_registro', { ascending: false })
  
  if (error) throw error
  return data as Buque[]
}

export async function getBuqueById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buques')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Buque
}

export async function createBuque(buque: Omit<Buque, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buques')
    .insert(buque)
    .select()
    .single()
  
  if (error) throw error
  return data as Buque
}

export async function updateBuque(id: number, buque: Partial<Buque>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buques')
    .update(buque)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Buque
}

export async function deleteBuque(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('buques')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Búsqueda de buques
export async function searchBuques(searchTerm: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buques')
    .select('*')
    .or(`nombre_buque.ilike.%${searchTerm}%,matricula.ilike.%${searchTerm}%`)
    .order('nombre_buque')
  
  if (error) throw error
  return data as Buque[]
}

// Filtrar buques por estado
export async function getBuquesByEstado(estado: 'Activo' | 'Inactivo' | 'En Mantenimiento') {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buques')
    .select('*')
    .eq('estado', estado)
    .order('nombre_buque')
  
  if (error) throw error
  return data as Buque[]
}
