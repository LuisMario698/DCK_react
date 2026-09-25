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

    // Ya no existe una página /login: el inicio de sesión es un modal en la landing.
    // Sin sesión, devolvemos al inicio con ?login=1 para que el modal se abra solo.
    if (!user && isDashboard) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        url.searchParams.set('login', '1')
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
