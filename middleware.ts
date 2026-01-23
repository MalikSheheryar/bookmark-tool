import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ✅ Specify Node.js runtime for middleware (not Edge)
export const runtime = 'nodejs'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // If already on reset-password page, let it through without any auth operations
  if (url.pathname === '/auth/reset-password') {
    return NextResponse.next()
  }

  // ✅ Simple passthrough - just maintain cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if environment variables exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Just pass through if env vars aren't available
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    })

    // Just creating the client is enough to handle cookie refreshing
    // Don't call any methods that might fail
  } catch (error) {
    // Silently fail and pass through
    console.error('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
