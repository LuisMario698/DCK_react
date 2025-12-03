import { createClient } from '@/lib/supabase/client'
import { ManifiestoBasuron, ManifiestoBasuronConRelaciones } from '@/types/database'

export async function getManifiestosBasuron() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buque_id(id, nombre_buque)
    `)
    .order('fecha', { ascending: false })
  
  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

export async function getManifiestoBasuronById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buque_id(id, nombre_buque)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ManifiestoBasuronConRelaciones
}

export async function createManifiestoBasuron(manifiesto: Omit<ManifiestoBasuron, 'id' | 'created_at' | 'updated_at' | 'total_depositado'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .insert(manifiesto)
    .select()
    .single()
  
  if (error) throw error
  return data as ManifiestoBasuron
}

export async function updateManifiestoBasuron(id: number, manifiesto: Partial<ManifiestoBasuron>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .update(manifiesto)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as ManifiestoBasuron
}

export async function deleteManifiestoBasuron(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('manifiesto_basuron')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Completar manifiesto (agregar peso de salida)
export async function completarManifiestoBasuron(
  id: number, 
  pesoSalida: number
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .update({
      peso_salida: pesoSalida,
      estado: 'Completado'
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as ManifiestoBasuron
}

// Obtener manifiestos por buque
export async function getManifiestosBasuronByBuque(buqueId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('buque_id', buqueId)
    .order('fecha', { ascending: false })
  
  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

// Obtener manifiestos por fecha
export async function getManifiestosBasuronByFecha(fecha: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('fecha', fecha)
    .order('hora_entrada')
  
  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

// Obtener manifiestos por rango de fechas
export async function getManifiestosBasuronByRangoFechas(fechaInicio: string, fechaFin: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: false })
    .order('hora_entrada', { ascending: false })
  
  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

// Obtener manifiestos en proceso (sin hora de salida)
export async function getManifiestosEnProceso() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('estado', 'En Proceso')
    .order('hora_entrada')
  
  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

// Estadísticas de manifiestos basurón
export async function getEstadisticasManifiestosBasuron(fecha?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('manifiesto_basuron')
    .select('peso_entrada, peso_salida, total_depositado')
  
  if (fecha) {
    query = query.eq('fecha', fecha)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  const stats = {
    total: data.length,
    completados: 0,
    enProceso: 0,
    pesoTotalDepositado: data.reduce((sum, m) => sum + Number(m.total_depositado || 0), 0),
    pesoPromedioDepositado: data.length > 0 
      ? data.reduce((sum, m) => sum + Number(m.total_depositado || 0), 0) / data.length 
      : 0,
  }
  
  return stats
}

// Buscar por número de ticket
export async function getManifiestoBasuronByTicket(numeroTicket: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      usuario_sistema:usuarios_sistema(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('numero_ticket', numeroTicket)
    .single()
  
  if (error) throw error
  return data as ManifiestoBasuronConRelaciones
}
