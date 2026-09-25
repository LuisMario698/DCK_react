import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/i18n'

type Rol = 'admin' | 'recolector' | 'pendiente'

/** Ruta de inicio de cada rol (sin el prefijo de idioma). */
const INICIO_POR_ROL: Record<Rol, string> = {
    admin: '/dashboard',
    recolector: '/dashboard-recolector',
    pendiente: '/acceso-pendiente',
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
    // Sin sesión, devolvemos al inicio con ?login=1 para que el modal se abra solo.
    if (!user && isDashboard) {
        return redirigir('/', { login: '1' })
    }

    // Con sesión, el rol se lee de `profiles` (no de la cookie simar_user_role,
    // que el navegador puede modificar). Cada rol sólo entra a su área.
    if (user && isDashboard) {
        const { data: perfil } = await supabase
            .from('profiles')
            .select('rol')
            .eq('id', user.id)
            .maybeSingle()

        const rol: Rol = (perfil?.rol as Rol) ?? 'pendiente'

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
