import { createBrowserClient } from '@supabase/ssr'
import { MODO_DEMO } from '@/lib/demo/config'
import { fetchDemo } from '@/lib/demo/supabaseDemo'
import { callarErroresDeLaDemo } from '@/lib/demo/avisos'

// En la demostración las escrituras se detienen antes de salir (ver lib/demo/supabaseDemo.ts)
if (MODO_DEMO && typeof window !== 'undefined') callarErroresDeLaDemo()

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SB_URL!,
    process.env.NEXT_PUBLIC_SB_ANON_KEY!,
    MODO_DEMO ? { global: { fetch: fetchDemo } } : undefined
  )
}
