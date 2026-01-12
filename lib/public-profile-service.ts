// File: lib/public-profile-service.ts
import { createClient } from './supabase-client'

export interface PublicProfile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  profile_picture_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  other_link: string | null
  created_at: string
  public_categories: PublicCategory[]
}

export interface PublicCategory {
  id: string
  name: string
  emoji: string | null
  category_order: number
  bookmark_count: number
}

export interface PublicBookmark {
  site_name: string
  site_url: string
  created_at: string
}

/**
 * Search for public profiles by username
 */
export async function searchPublicProfiles(
  searchQuery: string
): Promise<PublicProfile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .ilike('username', `%${searchQuery}%`)
    .limit(20)

  if (error) {
    console.error('Error searching profiles:', error)
    throw new Error('Failed to search profiles')
  }

  return data as PublicProfile[]
}

/**
 * Get a public profile by username
 */
export async function getPublicProfile(
  username: string
): Promise<PublicProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    console.error('Error fetching public profile:', error)
    throw new Error('Failed to fetch public profile')
  }

  return data as PublicProfile | null
}

/**
 * Get public bookmarks for a specific category
 */
export async function getPublicCategoryBookmarks(
  username: string,
  categoryName: string
): Promise<PublicBookmark[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_public_category_bookmarks', {
    p_username: username,
    p_category_name: categoryName,
  })

  if (error) {
    console.error('Error fetching public bookmarks:', error)
    throw new Error('Failed to fetch public bookmarks')
  }

  return data as PublicBookmark[]
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  const supabase = createClient()

  let query = supabase.from('users').select('id').eq('username', username)

  if (excludeUserId) {
    query = query.neq('id', excludeUserId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error checking username:', error)
    return false
  }

  return !data // Available if no data found
}

/**
 * Generate a unique username from full name
 */
export async function generateUsername(fullName: string): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('generate_username', {
    base_name: fullName || 'user',
  })

  if (error) {
    console.error('Error generating username:', error)
    // Fallback to simple generation
    const base = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15)
    return `${base}${Math.floor(Math.random() * 10000)}`
  }

  return data as string
}

/**
 * Get all public profiles (for browse/discovery)
 */
export async function getAllPublicProfiles(
  limit: number = 50
): Promise<PublicProfile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching public profiles:', error)
    throw new Error('Failed to fetch public profiles')
  }

  return data as PublicProfile[]
}
