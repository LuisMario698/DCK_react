import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { COOKIE_BASE, baseDeCookie, type BaseDatos } from './baseDatos'
import { conDatosDeDck } from './dck'
import { DCK_SERVIDOR_DISPONIBLE, crearClienteDckServidor } from './dckServidor'

/**
 * Cliente de Supabase para Server Components. Con `conBaseElegida` (landing y recinto) respeta la
 * base que eligió el superadmin en su navegador: con la de DCK, los registros salen de ahí y sólo se
 * leen (ver lib/supabase/dck.ts).
 */
export const createServerClient = async ({ conBaseElegida = false }: { conBaseElegida?: boolean } = {}) => {
  const cookieStore = await cookies()

  const simar = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SB_URL!,
    process.env.NEXT_PUBLIC_SB_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  if (!conBaseElegida || !pideDck(cookieStore.get(COOKIE_BASE)?.value)) return simar
  return conDatosDeDck(simar, crearClienteDckServidor())
}

/** ¿La cookie pide la base de DCK y el servidor tiene con qué leerla? */
function pideDck(valor: string | undefined) {
  return DCK_SERVIDOR_DISPONIBLE && baseDeCookie(valor) === 'dck'
}

/** La base que eligió este navegador (SiMAR si no eligió nada o si el servidor no tiene la llave de DCK) */
export async function baseElegida(): Promise<BaseDatos> {
  return pideDck((await cookies()).get(COOKIE_BASE)?.value) ? 'dck' : 'simar'
}
