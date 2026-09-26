import { createClient } from '@/lib/supabase/client'
import type { AsociacionRecolectora, PagoSuscripcion, Plan, Suscripcion } from '@/types/database'
import type { EstadoSuscripcion, MetodoPago } from '@/lib/constants/suscripciones'

// ─────────────────────────────────────────────────────────────────────
// Planes (sólo superadmin puede escribir)
// ─────────────────────────────────────────────────────────────────────

export type PlanInput = Omit<Plan, 'id' | 'created_at' | 'updated_at'>

export async function getPlanes() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('planes')
    .select('*')
    .order('orden')
    .order('precio_mensual')

  if (error) throw error
  return data as Plan[]
}

export async function createPlan(plan: PlanInput) {
  const supabase = createClient()

  const { data, error } = await supabase.from('planes').insert(plan).select().single()
  if (error) throw error
  return data as Plan
}

export async function updatePlan(id: number, plan: Partial<PlanInput>) {
  const supabase = createClient()

  const { data, error } = await supabase.from('planes').update(plan).eq('id', id).select().single()
  if (error) throw error
  return data as Plan
}

export async function deletePlan(id: number) {
  const supabase = createClient()

  const { error } = await supabase.from('planes').delete().eq('id', id)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────
// Suscripciones (una por asociación)
// ─────────────────────────────────────────────────────────────────────

export interface SuscripcionConPlan extends Suscripcion {
  plan: Plan | null
}

export interface AsociacionConSuscripcion extends AsociacionRecolectora {
  suscripcion: SuscripcionConPlan | null
  /** Cuentas vinculadas a la asociación. */
  usuarios: number
}

type FilaAsociacion = AsociacionRecolectora & {
  suscripcion: SuscripcionConPlan | SuscripcionConPlan[] | null
  usuarios: { count: number }[]
}

/** Todas las asociaciones con su suscripción, plan y número de usuarios. */
export async function getAsociacionesConSuscripcion() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asociaciones_recolectoras')
    .select('*, suscripcion:suscripciones(*, plan:planes(*)), usuarios:profiles(count)')
    .order('nombre_asociacion')

  if (error) throw error
  return (data as FilaAsociacion[]).map(({ suscripcion, usuarios, ...asociacion }) => ({
    ...asociacion,
    // asociacion_id es único: PostgREST lo devuelve como objeto, pero por si acaso
    suscripcion: Array.isArray(suscripcion) ? suscripcion[0] ?? null : suscripcion,
    usuarios: usuarios?.[0]?.count ?? 0,
  })) as AsociacionConSuscripcion[]
}

export type SuscripcionInput = Pick<
  Suscripcion,
  'asociacion_id' | 'plan_id' | 'estado' | 'ciclo' | 'precio' | 'fecha_inicio' | 'vence_el' | 'notas'
>

export async function createSuscripcion(suscripcion: SuscripcionInput) {
  const supabase = createClient()

  const { data, error } = await supabase.from('suscripciones').insert(suscripcion).select().single()
  if (error) throw error
  return data as Suscripcion
}

export async function updateSuscripcion(id: number, suscripcion: Partial<SuscripcionInput>) {
  const supabase = createClient()

  const { data, error } = await supabase.from('suscripciones').update(suscripcion).eq('id', id).select().single()
  if (error) throw error
  return data as Suscripcion
}

/** Borra la suscripción y, en cascada, sus pagos (quedan en la bitácora). */
export async function deleteSuscripcion(id: number) {
  const supabase = createClient()

  const { error } = await supabase.from('suscripciones').delete().eq('id', id)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────
// Pagos
// ─────────────────────────────────────────────────────────────────────

export interface PagoConAsociacion extends PagoSuscripcion {
  suscripcion: { asociacion_id: number; asociacion: { nombre_asociacion: string } | null } | null
}

export async function getPagos(suscripcionId?: number) {
  const supabase = createClient()

  let query = supabase
    .from('pagos_suscripcion')
    .select('*, suscripcion:suscripciones(asociacion_id, asociacion:asociaciones_recolectoras(nombre_asociacion))')
    .order('fecha_pago', { ascending: false })
    .order('created_at', { ascending: false })

  if (suscripcionId) query = query.eq('suscripcion_id', suscripcionId)

  const { data, error } = await query
  if (error) throw error
  return data as PagoConAsociacion[]
}

export interface PagoInput {
  suscripcion_id: number
  monto: number
  fecha_pago: string
  metodo: MetodoPago
  referencia: string | null
  /** Si se indica, extiende la vigencia de la suscripción hasta esa fecha. */
  cubre_hasta: string | null
  notas: string | null
}

export async function registrarPago(pago: PagoInput) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('sa_registrar_pago', {
    p_suscripcion_id: pago.suscripcion_id,
    p_monto: pago.monto,
    p_fecha_pago: pago.fecha_pago,
    p_metodo: pago.metodo,
    p_referencia: pago.referencia,
    p_cubre_hasta: pago.cubre_hasta,
    p_notas: pago.notas,
  })

  if (error) throw error
  return data as PagoSuscripcion
}

export async function deletePago(id: number) {
  const supabase = createClient()

  const { error } = await supabase.from('pagos_suscripcion').delete().eq('id', id)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────
// Portal recolector
// ─────────────────────────────────────────────────────────────────────

export interface EstadoMiSuscripcion {
  /** El superadmin exige suscripción vigente para crear solicitudes. */
  obligatoria: boolean
  vigente: boolean
  estado: EstadoSuscripcion | null
  vence_el: string | null
  plan: string | null
}

/**
 * Estado de la suscripción de la asociación del usuario. `null` si no es
 * recolector o si la migración del panel de superadmin aún no está aplicada.
 */
export async function getEstadoMiSuscripcion(): Promise<EstadoMiSuscripcion | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('estado_mi_suscripcion')
  if (error) return null
  return data as EstadoMiSuscripcion | null
}
