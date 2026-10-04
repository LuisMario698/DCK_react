import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MODO_DEMO } from '@/lib/demo/config'
import { fetchDemo } from '@/lib/demo/supabaseDemo'
import { callarErroresDeLaDemo } from '@/lib/demo/avisos'
import { enModoDck } from './baseDatos'
import { conDatosDeDck, crearClienteDckNavegador } from './dck'
import { avisarSoloConsulta } from './avisoDck'

// En la demostración las escrituras se detienen antes de salir (ver lib/demo/supabaseDemo.ts)
if (MODO_DEMO && typeof window !== 'undefined') callarErroresDeLaDemo()

// Uno solo por pestaña, como el de SiMAR (y el mismo cliente combinado cada vez: hay pantallas que
// lo usan como dependencia de un efecto)
let clienteDck: SupabaseClient | null = null
let combinado: { simar: object; cliente: object } | null = null

export const createClient = () => {
  const simar = createBrowserClient(
    process.env.NEXT_PUBLIC_SB_URL!,
    process.env.NEXT_PUBLIC_SB_ANON_KEY!,
    MODO_DEMO ? { global: { fetch: fetchDemo } } : undefined
  )
  // Un superadmin eligió ver la base de DCK: en la landing y el recinto los registros salen de ahí
  if (!enModoDck()) return simar
  clienteDck ??= crearClienteDckNavegador(avisarSoloConsulta)
  if (combinado?.simar !== simar) combinado = { simar, cliente: conDatosDeDck(simar, clienteDck) }
  return combinado.cliente as typeof simar
}
