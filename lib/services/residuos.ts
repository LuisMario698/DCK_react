import { createClient } from '@/lib/supabase/client'
import { Residuo, ResiduoConRelaciones } from '@/types/database'

export async function getResiduos() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('residuos')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*),
      cumplimiento:cumplimiento(*)
    `)
    .order('fecha_generacion', { ascending: false })
  
  if (error) throw error
  return data as ResiduoConRelaciones[]
}

export async function getResiduoById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('residuos')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*),
      cumplimiento:cumplimiento(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ResiduoConRelaciones
}

export async function createResiduo(residuo: Omit<Residuo, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('residuos')
    .insert(residuo)
    .select()
    .single()
  
  if (error) throw error
  return data as Residuo
}

export async function updateResiduo(id: number, residuo: Partial<Residuo>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('residuos')
    .update(residuo)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Residuo
}

export async function deleteResiduo(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('residuos')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Obtener residuos por buque
export async function getResiduosByBuque(buqueId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('residuos')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('buque_id', buqueId)
    .order('fecha_generacion', { ascending: false })
  
  if (error) throw error
  return data as ResiduoConRelaciones[]
}

// Obtener residuos por tipo
export async function getResiduosByTipo(tipoResiduoId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('residuos')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('tipo_residuo_id', tipoResiduoId)
    .order('fecha_generacion', { ascending: false })
  
  if (error) throw error
  return data as ResiduoConRelaciones[]
}

// Obtener residuos por estado
export async function getResiduosByEstado(estado: 'Generado' | 'Almacenado' | 'Recolectado' | 'Procesado') {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('residuos')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('estado', estado)
    .order('fecha_generacion', { ascending: false })
  
  if (error) throw error
  return data as ResiduoConRelaciones[]
}

// Estadísticas de residuos
export async function getEstadisticasResiduos() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('residuos')
    .select('estado, cantidad_generada')
  
  if (error) throw error
  
  // Calcular estadísticas
  const stats = {
    total: data.length,
    cantidadTotal: data.reduce((sum, r) => sum + Number(r.cantidad_generada), 0),
    porEstado: {
      generado: data.filter(r => r.estado === 'Generado').length,
      almacenado: data.filter(r => r.estado === 'Almacenado').length,
      recolectado: data.filter(r => r.estado === 'Recolectado').length,
      procesado: data.filter(r => r.estado === 'Procesado').length,
    }
  }
  
  return stats
}
