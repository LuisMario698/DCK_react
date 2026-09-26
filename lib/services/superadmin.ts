import { createClient } from '@/lib/supabase/client'
import type { CuentaUsuario, EntradaAuditoria, Invitacion, RolUsuario } from '@/types/database'

// Servicios del panel de superadmin (/superadmin). Las RPC `sa_*` validan en
// la base de datos que quien llama sea superadmin (is_superadmin()).

// ─────────────────────────────────────────────────────────────────────
// Cuentas
// ─────────────────────────────────────────────────────────────────────

export async function getCuentas() {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('sa_listar_usuarios')
  if (error) throw error
  return data as CuentaUsuario[]
}

export async function actualizarCuenta(usuarioId: string, rol: RolUsuario, asociacionId: number | null) {
  const supabase = createClient()

  const { error } = await supabase.rpc('sa_actualizar_usuario', {
    p_usuario: usuarioId,
    p_rol: rol,
    p_asociacion_id: rol === 'recolector' ? asociacionId : null,
  })
  if (error) throw error
}

/** Corta el acceso a los datos, cierra sus sesiones e impide volver a entrar. */
export async function suspenderCuenta(usuarioId: string, motivo: string | null) {
  const supabase = createClient()

  const { error } = await supabase.rpc('sa_suspender_usuario', { p_usuario: usuarioId, p_motivo: motivo })
  if (error) throw error
}

export async function reactivarCuenta(usuarioId: string) {
  const supabase = createClient()

  const { error } = await supabase.rpc('sa_reactivar_usuario', { p_usuario: usuarioId })
  if (error) throw error
}

export async function cambiarSuperadmin(usuarioId: string, valor: boolean) {
  const supabase = createClient()

  const { error } = await supabase.rpc('sa_cambiar_superadmin', { p_usuario: usuarioId, p_valor: valor })
  if (error) throw error
}

/** Borra la cuenta de Supabase Auth. No se puede deshacer. */
export async function eliminarCuenta(usuarioId: string) {
  const supabase = createClient()

  const { error } = await supabase.rpc('sa_eliminar_usuario', { p_usuario: usuarioId })
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────
// Invitaciones (cualquier rol; reutiliza la RPC del módulo de asociaciones)
// ─────────────────────────────────────────────────────────────────────

export interface InvitacionConAsociacion extends Invitacion {
  asociacion: { nombre_asociacion: string } | null
}

export async function getInvitacionesPendientes() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('invitaciones')
    .select('*, asociacion:asociaciones_recolectoras(nombre_asociacion)')
    .is('aceptada_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as InvitacionConAsociacion[]
}

/** 'vinculado' si el correo ya tenía cuenta; 'invitado' si queda pendiente de registro. */
export async function invitarCuenta(email: string, rol: 'admin' | 'recolector', asociacionId: number | null) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('invitar_usuario', {
    p_email: email,
    p_rol: rol,
    p_asociacion_id: rol === 'recolector' ? asociacionId : null,
  })
  if (error) throw error
  return data as 'vinculado' | 'invitado'
}

// ─────────────────────────────────────────────────────────────────────
// Métricas del sistema
// ─────────────────────────────────────────────────────────────────────

export interface MetricasSistema {
  usuarios: {
    total: number
    admin: number
    recolector: number
    pendiente: number
    superadmin: number
    suspendidos: number
    sin_confirmar: number
    nuevos_30d: number
    activos_30d: number
  }
  invitaciones_pendientes: number
  bd_bytes: number
  tablas: { tabla: string; filas: number; bytes: number }[]
  storage: { bucket: string; publico: boolean; archivos: number; bytes: number }[]
}

export async function getMetricas() {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('sa_metricas')
  if (error) throw error
  return data as MetricasSistema
}

// ─────────────────────────────────────────────────────────────────────
// Bitácora (audit_log)
// ─────────────────────────────────────────────────────────────────────

export interface FiltrosAuditoria {
  tabla?: string
  operacion?: EntradaAuditoria['operacion']
  /** Correo (parcial) de quien hizo el cambio. */
  usuario?: string
  /** 'YYYY-MM-DD', inclusive. */
  desde?: string
  hasta?: string
}

export async function getAuditoria(filtros: FiltrosAuditoria, pagina: number, porPagina = 25) {
  const supabase = createClient()

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(pagina * porPagina, pagina * porPagina + porPagina - 1)

  if (filtros.tabla) query = query.eq('tabla', filtros.tabla)
  if (filtros.operacion) query = query.eq('operacion', filtros.operacion)
  if (filtros.usuario) query = query.ilike('usuario_email', `%${filtros.usuario}%`)
  // Días completos en la hora de Puerto Peñasco (UTC-7, sin horario de verano)
  if (filtros.desde) query = query.gte('created_at', `${filtros.desde}T00:00:00-07:00`)
  if (filtros.hasta) query = query.lte('created_at', `${filtros.hasta}T23:59:59.999-07:00`)

  const { data, count, error } = await query
  if (error) throw error
  return { entradas: data as EntradaAuditoria[], total: count ?? 0 }
}
