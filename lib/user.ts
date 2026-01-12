import { createClient } from './supabase-client'
import type { Database } from './supabase-client'

type UserProfile = Database['public']['Tables']['users']['Row']

export function createUserProfileClient(
  authId: string,
  email: string,
  fullName?: string
) {
  const supabase = createClient()

  return supabase
    .from('users')
    .insert({
      auth_id: authId,
      email,
      full_name: fullName || '',
    })
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) throw error
      return data as UserProfile
    })
}
