// File: lib/shared-category-service.ts
import { createClient } from './supabase-client'

export interface SharedCategoryData {
  message_id: string
  share_token: string
  sender_id: string
  recipient_id: string
  category_name: string
  category_emoji: string | null
  is_public_category: boolean
  sender_username: string
  sender_full_name: string | null
  sender_profile_picture: string | null
  note: string | null
  bookmarks: Array<{
    site_name: string
    site_url: string
    created_at: string
  }>
  created_at: string
}

/**
 * Get shared category data by token
 * Works for BOTH public and private categories
 */
export async function getSharedCategoryData(
  token: string
): Promise<SharedCategoryData | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_shared_category_by_token', {
      token: token,
    })

    if (error) {
      console.error('Error fetching shared category:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.log('No shared category found for token:', token)
      return null
    }

    // Parse bookmarks from JSON
    const result = data[0]
    return {
      ...result,
      bookmarks:
        typeof result.bookmarks === 'string'
          ? JSON.parse(result.bookmarks)
          : result.bookmarks,
    } as SharedCategoryData
  } catch (error) {
    console.error('Error in getSharedCategoryData:', error)
    return null
  }
}

/**
 * Generate a unique share token
 */
export function generateShareToken(): string {
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36).slice(-6)
  )
}

/**
 * Validate share token format
 */
export function isValidShareToken(token: string): boolean {
  return /^[a-z0-9]{14,20}$/i.test(token)
}
