import { createClient } from '@/lib/supabase/client'
import { InventarioResiduo } from '@/types/database'
import type { TipoResiduo, UnidadResiduo } from '@/lib/constants/residuos'

/**
 * Inventario de residuos. El admin ve todo; el recolector sólo lo publicado
 * (lo filtra la política RLS).
 */
export async function getInventario() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('inventario_residuos')
    .select('*')
    .order('tipo')

  if (error) throw error
  return (data as InventarioResiduo[]).map((i) => ({ ...i, cantidad: Number(i.cantidad) }))
}

export interface InventarioInput {
  tipo: TipoResiduo
  cantidad: number
  unidad: UnidadResiduo
  notas: string | null
  publicado: boolean
}

export async function createInventario(item: InventarioInput) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('inventario_residuos')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data as InventarioResiduo
}

export async function updateInventario(id: number, cambios: Partial<InventarioInput>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('inventario_residuos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as InventarioResiduo
}

export async function deleteInventario(id: number) {
  const supabase = createClient()

  const { error } = await supabase.from('inventario_residuos').delete().eq('id', id)
  if (error) throw error
}
