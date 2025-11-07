import { createClient } from '@/lib/supabase/client'
import { TipoPersona } from '@/types/database'

export async function getTiposPersona() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tipos_persona')
    .select('*')
    .order('nombre_tipo')
  
  if (error) throw error
  return data as TipoPersona[]
}

export async function getTipoPersonaById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tipos_persona')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as TipoPersona
}

export async function createTipoPersona(tipo: Omit<TipoPersona, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tipos_persona')
    .insert({
      nombre_tipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion || null
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error en createTipoPersona:', error);
    throw new Error(error.message || 'Error al crear tipo de persona');
  }
  return data as TipoPersona
}

export async function updateTipoPersona(id: number, tipo: Partial<TipoPersona>) {
  const supabase = createClient()
  
  const updateData: any = {};
  if (tipo.nombre_tipo !== undefined) updateData.nombre_tipo = tipo.nombre_tipo;
  if (tipo.descripcion !== undefined) updateData.descripcion = tipo.descripcion || null;
  
  const { data, error } = await supabase
    .from('tipos_persona')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error en updateTipoPersona:', error);
    throw new Error(error.message || 'Error al actualizar tipo de persona');
  }
  return data as TipoPersona
}

export async function deleteTipoPersona(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('tipos_persona')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
