import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
    const isLogin = pathname.includes('/login')

    // Proteger rutas de dashboard: redirigir al login si no hay sesión
    if (!user && isDashboard) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Usuario autenticado en la página de login: redirigir al panel correcto
    if (user && isLogin) {
        const role = request.cookies.get('simar_user_role')?.value
        const url = request.nextUrl.clone()
        url.pathname = role === 'recolector' ? '/dashboard-recolector' : '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
