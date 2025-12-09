import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { updateSession } from './utils/supabase/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use the locale prefix
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
  // 1. Update Supabase session (handles redirects for protected routes)
  const response = await updateSession(request);

  // If updateSession returned a redirect, return it immediately
  if (response.headers.get('location')) {
    return response;
  }

  // 2. Run intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
