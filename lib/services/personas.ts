import { createClient } from '@/lib/supabase/client'
import { Persona, PersonaConTipo } from '@/types/database'

export async function getPersonas() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('personas')
    .select(`
      *,
      tipo_persona:tipos_persona(*)
    `)
    .order('nombre')
  
  if (error) throw error
  return data as PersonaConTipo[]
}

export async function getPersonaById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('personas')
    .select(`
      *,
      tipo_persona:tipos_persona(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as PersonaConTipo
}

export async function createPersona(persona: Omit<Persona, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('personas')
    .insert(persona)
    .select()
    .single()
  
  if (error) throw error
  return data as Persona
}

export async function updatePersona(id: number, persona: Partial<Persona>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('personas')
    .update(persona)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Persona
}

export async function deletePersona(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Buscar personas
export async function searchPersonas(searchTerm: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('personas')
    .select(`
      *,
      tipo_persona:tipos_persona(*)
    `)
    .ilike('nombre', `%${searchTerm}%`)
    .order('nombre')
  
  if (error) throw error
  return data as PersonaConTipo[]
}

// Filtrar por tipo de persona
export async function getPersonasByTipo(tipoPersonaId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('personas')
    .select(`
      *,
      tipo_persona:tipos_persona(*)
    `)
    .eq('tipo_persona_id', tipoPersonaId)
    .order('nombre')
  
  if (error) throw error
  return data as PersonaConTipo[]
}
