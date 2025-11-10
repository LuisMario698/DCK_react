import { createClient } from '@/lib/supabase/client'
import { Manifiesto, ManifiestoConRelaciones } from '@/types/database'

export async function getManifiestos() {
  const supabase = createClient()
  
  console.log('🔍 Obteniendo manifiestos...')
  
  // Primero intenta obtener solo los manifiestos sin relaciones
  const { data: manifiestosSolos, error: errorSolos } = await supabase
    .from('manifiestos')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (errorSolos) {
    console.error('❌ Error obteniendo manifiestos (sin relaciones):', errorSolos)
    throw errorSolos
  }
  
  console.log('✅ Manifiestos obtenidos (sin relaciones):', manifiestosSolos?.length || 0, 'registros')
  
  // Si no hay manifiestos, retorna array vacío
  if (!manifiestosSolos || manifiestosSolos.length === 0) {
    console.log('ℹ️ No hay manifiestos en la base de datos')
    return []
  }
  
  // Intenta obtener con relaciones
  const { data, error } = await supabase
    .from('manifiestos')
    .select(`
      *,
      buque:buques(id, nombre_buque),
      generador:personas(id, nombre)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error obteniendo manifiestos con relaciones:', error)
    console.log('⚠️ Retornando manifiestos sin relaciones')
    return manifiestosSolos as ManifiestoConRelaciones[]
  }
  
  console.log('✅ Manifiestos obtenidos con relaciones:', data?.length || 0, 'registros')
  console.log('📊 Datos:', data)
  
  return data as ManifiestoConRelaciones[]
}

export async function getManifiestoById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiestos')
    .select(`
      *,
      buque:buques(nombre_buque),
      generador:personas!manifiestos_generador_id_fkey(nombre)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ManifiestoConRelaciones
}

export async function createManifiesto(
  manifiesto: Omit<Manifiesto, 'id' | 'created_at' | 'updated_at'>,
  residuos?: {
    aceite_usado: number;
    filtros_aceite: number;
    filtros_diesel: number;
    filtros_aire: number;
    basura: number;
    observaciones?: string;
  }
) {
  const supabase = createClient()
  
  // Insertar el manifiesto
  const { data: manifiestoData, error: manifiestoError } = await supabase
    .from('manifiestos')
    .insert(manifiesto)
    .select()
    .single()
  
  if (manifiestoError) throw manifiestoError
  
  // Si hay residuos, insertarlos en la tabla intermedia
  if (residuos && manifiestoData) {
    const residuosData = {
      manifiesto_id: manifiestoData.id,
      aceite_usado: residuos.aceite_usado || 0,
      filtros_aceite: residuos.filtros_aceite || 0,
      filtros_diesel: residuos.filtros_diesel || 0,
      filtros_aire: residuos.filtros_aire || 0,
      basura: residuos.basura || 0
    }
    
    const { error: residuosError } = await supabase
      .from('manifiestos_residuos')
      .insert(residuosData)
    
    if (residuosError) {
      console.error('Error insertando residuos:', residuosError)
      // No lanzar error para no bloquear la creación del manifiesto
    }
  }
  
  return manifiestoData as Manifiesto
}

export async function updateManifiesto(
  id: number, 
  manifiesto: Partial<Manifiesto>,
  residuos?: {
    aceite_usado: number;
    filtros_aceite: number;
    filtros_diesel: number;
    filtros_aire: number;
    basura: number;
    observaciones?: string;
  }
) {
  const supabase = createClient()
  
  // Actualizar el manifiesto
  const { data, error } = await supabase
    .from('manifiestos')
    .update(manifiesto)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // Si se proporcionan residuos, actualizar/insertar en la tabla intermedia
  if (residuos !== undefined) {
    const residuosData = {
      manifiesto_id: id,
      aceite_usado: residuos.aceite_usado || 0,
      filtros_aceite: residuos.filtros_aceite || 0,
      filtros_diesel: residuos.filtros_diesel || 0,
      filtros_aire: residuos.filtros_aire || 0,
      basura: residuos.basura || 0
    }
    
    // Usar upsert para insertar o actualizar
    const { error: residuosError } = await supabase
      .from('manifiestos_residuos')
      .upsert(residuosData, { onConflict: 'manifiesto_id' })
    
    if (residuosError) {
      console.error('Error actualizando residuos:', residuosError)
    }
  }
  
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

export async function getManifiestoResiduos(manifiestoId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiestos_residuos')
    .select(`
      *,
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('manifiesto_id', manifiestoId)
  
  if (error) throw error
  return data
}
