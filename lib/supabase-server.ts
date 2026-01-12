import { createServerClient } from '@supabase/ssr'
import type { Database } from './supabase-client'

// Import cookies only inside the function where it's needed
export async function getServerClient() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  const serverClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )

  return serverClient
}
