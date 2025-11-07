import { createClient } from '@/lib/supabase/client'
import { ReutilizacionResiduo, ReutilizacionConRelaciones } from '@/types/database'

export async function getReutilizaciones() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reutilizacion_residuos')
    .select(`
      *,
      residuo:residuos(
        *,
        buque:buques(*),
        tipo_residuo:tipos_residuos(*)
      ),
      asociacion:asociaciones_recolectoras(*)
    `)
    .order('fecha_reutilizacion', { ascending: false })
  
  if (error) throw error
  return data as ReutilizacionConRelaciones[]
}

export async function getReutilizacionById(id: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reutilizacion_residuos')
    .select(`
      *,
      residuo:residuos(
        *,
        buque:buques(*),
        tipo_residuo:tipos_residuos(*)
      ),
      asociacion:asociaciones_recolectoras(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ReutilizacionConRelaciones
}

export async function createReutilizacion(reutilizacion: Omit<ReutilizacionResiduo, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reutilizacion_residuos')
    .insert(reutilizacion)
    .select()
    .single()
  
  if (error) throw error
  return data as ReutilizacionResiduo
}

export async function updateReutilizacion(id: number, reutilizacion: Partial<ReutilizacionResiduo>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reutilizacion_residuos')
    .update(reutilizacion)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as ReutilizacionResiduo
}

export async function deleteReutilizacion(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('reutilizacion_residuos')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Obtener reutilizaciones por asociación
export async function getReutilizacionesByAsociacion(asociacionId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reutilizacion_residuos')
    .select(`
      *,
      residuo:residuos(*),
      asociacion:asociaciones_recolectoras(*)
    `)
    .eq('asociacion_id', asociacionId)
    .order('fecha_reutilizacion', { ascending: false })
  
  if (error) throw error
  return data as ReutilizacionConRelaciones[]
}

// Estadísticas de reutilización
export async function getEstadisticasReutilizacion() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reutilizacion_residuos')
    .select('cantidad_reutilizada, costo_proceso, ingreso_generado')
  
  if (error) throw error
  
  const stats = {
    total: data.length,
    cantidadTotal: data.reduce((sum, r) => sum + Number(r.cantidad_reutilizada), 0),
    costoTotal: data.reduce((sum, r) => sum + Number(r.costo_proceso || 0), 0),
    ingresoTotal: data.reduce((sum, r) => sum + Number(r.ingreso_generado || 0), 0),
  }
  
  return {
    ...stats,
    ganancia: stats.ingresoTotal - stats.costoTotal
  }
}
