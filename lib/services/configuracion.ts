import { createClient } from '@/lib/supabase/client'

// Configuración global del sistema (tabla `configuracion_sistema`). Las claves
// son fijas; el superadmin sólo edita su valor desde /superadmin/sistema.

export interface ConfigMantenimiento {
  activo: boolean
  mensaje?: string
}

export type TipoAviso = 'info' | 'advertencia' | 'critico'

export interface ConfigAvisoGlobal {
  activo: boolean
  mensaje?: string
  tipo?: TipoAviso
}

export interface ConfigSuscripciones {
  /** Sin suscripción vigente una asociación no puede crear solicitudes. */
  obligatorias: boolean
  /** Días de prueba que se proponen al crear una suscripción. */
  dias_prueba: number
}

export interface ConfiguracionSistema {
  mantenimiento: ConfigMantenimiento
  aviso_global: ConfigAvisoGlobal
  suscripciones: ConfigSuscripciones
}

export type ConfiguracionPublica = Pick<ConfiguracionSistema, 'mantenimiento' | 'aviso_global'>

/**
 * Aviso global y modo mantenimiento; lo puede leer cualquier usuario con
 * sesión. `null` si falla (p. ej. la migración aún no está aplicada).
 */
export async function getConfiguracionPublica(): Promise<ConfiguracionPublica | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('configuracion_publica')
  if (error) return null
  return data as ConfiguracionPublica
}

const PREDETERMINADA: ConfiguracionSistema = {
  mantenimiento: { activo: false, mensaje: '' },
  aviso_global: { activo: false, mensaje: '', tipo: 'info' },
  suscripciones: { obligatorias: false, dias_prueba: 30 },
}

/** Configuración completa (sólo superadmin). */
export async function getConfiguracion(): Promise<ConfiguracionSistema> {
  const supabase = createClient()

  const { data, error } = await supabase.from('configuracion_sistema').select('clave, valor')
  if (error) throw error

  const config = structuredClone(PREDETERMINADA)
  for (const { clave, valor } of data as { clave: keyof ConfiguracionSistema; valor: object }[]) {
    if (clave in config) Object.assign(config[clave], valor)
  }
  return config
}

export async function guardarConfiguracion<K extends keyof ConfiguracionSistema>(
  clave: K,
  valor: ConfiguracionSistema[K]
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('configuracion_sistema')
    .update({ valor })
    .eq('clave', clave)
    .select('clave')

  if (error) throw error
  if (!data?.length) throw new Error('No tienes permiso para cambiar la configuración.')
}
