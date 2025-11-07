import { createClient } from '@/lib/supabase/client'
import { Cumplimiento, CumplimientoConRelaciones } from '@/types/database'

export async function getCumplimientos() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('cumplimiento')
    .select(`
      *,
      buque:buques(*),
      usuario_sistema:usuarios_sistema(*)
    `)
    .order('fecha_inspeccion', { ascending: false })
  
  if (error) throw error
  return data as CumplimientoConRelaciones[]
}

export async function getCumplimientoById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('cumplimiento')
    .select(`
      *,
      buque:buques(*),
      usuario_sistema:usuarios_sistema(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as CumplimientoConRelaciones
}

export async function createCumplimiento(cumplimiento: Omit<Cumplimiento, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('cumplimiento')
    .insert(cumplimiento)
    .select()
    .single()
  
  if (error) throw error
  return data as Cumplimiento
}

export async function updateCumplimiento(id: number, cumplimiento: Partial<Cumplimiento>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('cumplimiento')
    .update(cumplimiento)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Cumplimiento
}

export async function deleteCumplimiento(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('cumplimiento')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Obtener cumplimientos por buque
export async function getCumplimientosByBuque(buqueId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('cumplimiento')
    .select(`
      *,
      buque:buques(*),
      usuario_sistema:usuarios_sistema(*)
    `)
    .eq('buque_id', buqueId)
    .order('fecha_inspeccion', { ascending: false })
  
  if (error) throw error
  return data as CumplimientoConRelaciones[]
}

// Filtrar por estado
export async function getCumplimientosByEstado(estado: 'Pendiente' | 'Aprobado' | 'Rechazado') {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('cumplimiento')
    .select(`
      *,
      buque:buques(*),
      usuario_sistema:usuarios_sistema(*)
    `)
    .eq('estado', estado)
    .order('fecha_inspeccion', { ascending: false })
  
  if (error) throw error
  return data as CumplimientoConRelaciones[]
}

// Estadísticas de cumplimiento
export async function getEstadisticasCumplimiento() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('cumplimiento')
    .select('estado, calificacion')
  
  if (error) throw error
  
  const stats = {
    total: data.length,
    porEstado: {
      pendientes: data.filter(c => c.estado === 'Pendiente').length,
      aprobados: data.filter(c => c.estado === 'Aprobado').length,
      rechazados: data.filter(c => c.estado === 'Rechazado').length,
    },
    porCalificacion: {
      excelente: data.filter(c => c.calificacion === 'Excelente').length,
      bueno: data.filter(c => c.calificacion === 'Bueno').length,
      regular: data.filter(c => c.calificacion === 'Regular').length,
      deficiente: data.filter(c => c.calificacion === 'Deficiente').length,
    }
  }
  
  return stats
}
