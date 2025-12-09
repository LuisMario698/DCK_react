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

// Crear persona automáticamente desde manifiesto (registro incompleto)
export async function createPersonaAutomatica(nombre: string, tipoPersonaId: number) {
  const supabase = createClient()

  // Primero verificar si ya existe con ese nombre
  const { data: existente } = await supabase
    .from('personas')
    .select('id, nombre')
    .ilike('nombre', nombre)
    .single()

  if (existente) {
    return existente as Persona
  }

  // Crear nueva persona con datos mínimos
  const { data, error } = await supabase
    .from('personas')
    .insert({
      nombre: nombre,
      tipo_persona_id: tipoPersonaId,
      registro_completo: false
    })
    .select()
    .single()

  if (error) throw error
  return data as Persona
}

// Obtener personas con registro incompleto
export async function getPersonasIncompletas() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('personas')
    .select(`
      *,
      tipo_persona:tipos_persona(*)
    `)
    .eq('registro_completo', false)
    .order('nombre')

  if (error) throw error
  return data as PersonaConTipo[]
}

// Obtener o crear tipo de persona por nombre
export async function getOrCreateTipoPersona(nombreTipo: string) {
  const supabase = createClient()

  // Buscar tipo existente
  const { data: existente } = await supabase
    .from('tipos_persona')
    .select('*')
    .ilike('nombre_tipo', nombreTipo)
    .single()

  if (existente) {
    return existente
  }

  // Crear nuevo tipo
  const { data, error } = await supabase
    .from('tipos_persona')
    .insert({
      nombre_tipo: nombreTipo,
      descripcion: `Tipo creado automáticamente`
    })
    .select()
    .single()

  if (error) throw error
  return data
}
