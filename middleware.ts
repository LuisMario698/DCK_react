import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

const COOKIE_NAME = 'dck_session';

function getSecret() {
  const secret = process.env.SESSION_SECRET || 'dck-fallback-secret-32-chars-minimum!!';
  return new TextEncoder().encode(secret);
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale from path (e.g. /es/dashboard → /dashboard)
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';

  // Protect /dashboard routes
  if (pathnameWithoutLocale.startsWith('/dashboard')) {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      const locale = pathname.match(/^\/(es|en)/)?.[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  // Redirect authenticated users away from login
  if (pathnameWithoutLocale === '/login') {
    const authenticated = await isAuthenticated(request);
    if (authenticated) {
      const locale = pathname.match(/^\/(es|en)/)?.[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
