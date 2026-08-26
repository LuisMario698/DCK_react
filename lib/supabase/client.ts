import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SB_URL!,
    process.env.NEXT_PUBLIC_SB_ANON_KEY!
  )
}
