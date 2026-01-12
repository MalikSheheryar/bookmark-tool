// ============================================================================
// FILE: lib/auth.ts
// ============================================================================

import { createClient } from './supabase-client'
import { getServerClient } from './supabase-server'

/**
 * Gets the base URL for redirects, ensuring no whitespace
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Server-side: use environment variable, trimmed to remove any spaces
  const envUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?.trim()
  return envUrl || 'http://localhost:3000'
}

export async function signUp(
  email: string,
  password: string,
  metadata: { full_name?: string } = {}
) {
  const supabase = createClient()

  // Build clean redirect URL with no spaces
  const baseUrl = getBaseUrl()
  const redirectUrl = `${baseUrl}/auth/callback`

  console.log('📧 Sign up redirect URL:', redirectUrl)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  const supabase = createClient()

  const baseUrl = getBaseUrl()
  const redirectUrl = `${baseUrl}/auth/callback`

  console.log('🔗 Google OAuth redirect URL:', redirectUrl)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('❌ Google sign-in error:', error)
    throw error
  }

  console.log('✅ Google sign-in initiated')
  return data
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

export async function getCurrentUserServer() {
  try {
    const supabase = await getServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Server auth error:', error.message)
      return null
    }
    return user
  } catch (error) {
    console.error('Unexpected server auth error:', error)
    return null
  }
}

export async function resetPassword(email: string) {
  const supabase = createClient()

  const baseUrl = getBaseUrl()
  const redirectUrl = `${baseUrl}/auth/reset-password`

  // ENHANCED DEBUGGING
  console.log('🔍 ========== PASSWORD RESET DEBUG ==========')
  console.log('📧 Email:', email)
  console.log('🌐 Base URL:', baseUrl)
  console.log('🔗 Redirect URL:', redirectUrl)
  console.log('📏 Redirect URL length:', redirectUrl.length)
  console.log('✂️  Redirect URL trimmed:', redirectUrl.trim())
  console.log('❓ Has spaces:', redirectUrl !== redirectUrl.trim())
  console.log(
    '📊 Char codes:',
    Array.from(redirectUrl).map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`)
  )
  console.log(
    '🌍 Window origin:',
    typeof window !== 'undefined' ? window.location.origin : 'N/A'
  )
  console.log(
    '📦 ENV variable:',
    process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
  )
  console.log('==========================================')

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  console.log('📤 Supabase response:', { data, error })

  if (error) {
    console.error('❌ Reset password error:', error)
    throw error
  }

  console.log('✅ Reset password email sent')
  return data
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient()

  console.log('🔐 Updating password...')

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('❌ Update password error:', error)
    throw error
  }

  console.log('✅ Password updated successfully')
  return data
}
