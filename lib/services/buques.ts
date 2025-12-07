import { createClient } from '@/lib/supabase/client'
import { Buque } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getBuques(supabase?: SupabaseClient) {
  const client = supabase || createClient()

  const { data, error } = await client
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
  const supabase = createClient() // Se crea la conexion mediante un cliente de Supabase

  const { data, error } = await supabase
    .from('buques')
    .update(buque)  // Aqui es donde se actualiza la embarcacion con los nuevo datos
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

// Crear buque automáticamente desde manifiesto (registro incompleto)
export async function createBuqueAutomatico(nombre: string) {
  const supabase = createClient()

  // Primero verificar si ya existe
  const { data: existente } = await supabase
    .from('buques')
    .select('id, nombre_buque')
    .ilike('nombre_buque', nombre)
    .single()

  if (existente) {
    return existente as Buque
  }

  // Crear nuevo buque con datos mínimos
  const { data, error } = await supabase
    .from('buques')
    .insert({
      nombre_buque: nombre,
      fecha_registro: new Date().toISOString().split('T')[0],
      estado: 'Activo',
      registro_completo: false
    })
    .select()
    .single()

  if (error) throw error
  return data as Buque
}

// Obtener buques con registro incompleto
export async function getBuquesIncompletos() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('buques')
    .select('*')
    .eq('registro_completo', false)
    .order('nombre_buque')

  if (error) throw error
  return data as Buque[]
}
