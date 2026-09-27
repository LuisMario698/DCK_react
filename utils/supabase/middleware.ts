import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/i18n'

type Rol = 'admin' | 'recolector' | 'pendiente'

/** Ruta de inicio de cada rol (sin el prefijo de idioma). */
const INICIO_POR_ROL: Record<Rol, string> = {
    admin: '/dashboard',
    recolector: '/dashboard-recolector',
    pendiente: '/acceso-pendiente',
}

interface Acceso {
    rol: Rol
    es_superadmin: boolean
    /** Asociación con la que un superadmin usa el portal recolector. */
    asociacion_id: number | null
    suspendida: boolean
    mantenimiento: boolean
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SB_URL!,
        process.env.NEXT_PUBLIC_SB_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    const isDashboard = pathname.includes('/dashboard')
    const isRecolectorArea = pathname.includes('/dashboard-recolector')
    const isSuperadminArea = pathname.includes('/superadmin')
    const isProtegida = isDashboard || isSuperadminArea

    // Redirección que conserva las cookies de sesión refrescadas por Supabase
    const redirigir = (destino: string, params?: Record<string, string>) => {
        const url = request.nextUrl.clone()
        url.pathname = destino
        url.search = ''
        Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v))
        const respuesta = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach((c) => respuesta.cookies.set(c))
        return respuesta
    }

    const primerSegmento = pathname.split('/')[1]
    const locale = (locales as readonly string[]).includes(primerSegmento) ? primerSegmento : defaultLocale

    // Ya no existe una página /login: el inicio de sesión es un modal en la landing.
    // Sin sesión, devolvemos al inicio con ?login=1 para que el modal se abra solo
    // y ?siguiente para volver a la página pedida después de iniciar sesión.
    if (!user && isProtegida) {
        return redirigir('/', { login: '1', siguiente: pathname })
    }

    // Con sesión, el rol se lee de la BD (no de la cookie simar_user_role,
    // que el navegador puede modificar). Cada rol sólo entra a su área.
    if (user && isProtegida) {
        const acceso = await leerAcceso(supabase, user.id)

        if (acceso.suspendida) {
            return redirigir(`/${locale}${INICIO_POR_ROL.pendiente}`, { motivo: 'suspendida' })
        }
        // En mantenimiento sólo entran los superadmins
        if (acceso.mantenimiento && !acceso.es_superadmin) {
            return redirigir(`/${locale}/mantenimiento`)
        }
        if (isSuperadminArea) {
            if (!acceso.es_superadmin) {
                return redirigir(`/${locale}${INICIO_POR_ROL[acceso.rol]}`)
            }
            return supabaseResponse
        }

        // El superadmin entra al recinto (es admin) y al portal recolector a
        // nombre de su asociación; si aún no eligió una, la elige en su panel.
        if (acceso.es_superadmin) {
            if (isRecolectorArea && !acceso.asociacion_id) {
                return redirigir(`/${locale}/superadmin`, { elegir_asociacion: '1' })
            }
            return supabaseResponse
        }

        const { rol } = acceso
        if (rol === 'pendiente') {
            return redirigir(`/${locale}${INICIO_POR_ROL.pendiente}`)
        }
        if (rol === 'admin' && isRecolectorArea) {
            return redirigir(`/${locale}${INICIO_POR_ROL.admin}`)
        }
        if (rol === 'recolector' && !isRecolectorArea) {
            return redirigir(`/${locale}${INICIO_POR_ROL.recolector}`)
        }
    }

    return supabaseResponse
}

/**
 * Rol, superadmin, suspensión y mantenimiento en una sola llamada (RPC
 * `mi_acceso`). Si la RPC no existe todavía (migración del panel de superadmin
 * sin aplicar) se cae a leer sólo `profiles.rol`, como antes.
 */
async function leerAcceso(supabase: SupabaseClient, userId: string): Promise<Acceso> {
    const { data, error } = await supabase.rpc('mi_acceso')
    if (!error && data) {
        const acceso = data as Acceso
        return { ...acceso, rol: acceso.rol in INICIO_POR_ROL ? acceso.rol : 'pendiente' }
    }

    const { data: perfil } = await supabase.from('profiles').select('rol').eq('id', userId).maybeSingle()
    return {
        rol: (perfil?.rol as Rol) ?? 'pendiente',
        es_superadmin: false,
        asociacion_id: null,
        suspendida: false,
        mantenimiento: false,
    }
}
