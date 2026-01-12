// File: lib/user-service.ts

import { createClient } from './supabase-client'
import type { Database } from './supabase-client'

type UserProfile = Database['public']['Tables']['users']['Row']
type UserProfileUpdate = Database['public']['Tables']['users']['Update']

/**
 * Creates a new user profile in the database
 */
export async function createUserProfileClient(
  authId: string,
  email: string,
  fullName?: string
): Promise<UserProfile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_id: authId,
      email,
      full_name: fullName || '',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    throw new Error(error.message || 'Failed to create user profile')
  }

  if (!data) {
    throw new Error('No data returned from user profile creation')
  }

  return data as UserProfile
}

/**
 * Fetches user profile by auth_id (client-side)
 */
export async function getUserProfileClient(
  authId: string
): Promise<UserProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select(
      'id, auth_id, email, username, full_name, bio, profile_picture_url, instagram_url, twitter_url, other_link, created_at, updated_at'
    )
    .eq('auth_id', authId)
    .maybeSingle() // Use maybeSingle() to handle 0 or 1 results

  if (error) {
    console.error('Supabase error:', error)
    throw new Error(error.message || 'Failed to fetch user profile')
  }

  return data
}

/**
 * Updates user profile
 */
export async function updateUserProfile(
  authId: string,
  updates: Partial<UserProfileUpdate>
): Promise<UserProfile | null> {
  const supabase = createClient()

  // First check if profile exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .maybeSingle()

  if (fetchError) {
    console.error('Error checking existing profile:', fetchError)
    throw new Error(fetchError.message || 'Failed to check user profile')
  }

  // If profile doesn't exist, create it
  if (!existingProfile) {
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        auth_id: authId,
        email: updates.email || '',
        full_name: updates.full_name || '',
        bio: updates.bio || null,
        profile_picture_url: updates.profile_picture_url || null,
        instagram_url: updates.instagram_url || null,
        twitter_url: updates.twitter_url || null,
        other_link: updates.other_link || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      throw new Error(createError.message || 'Failed to create user profile')
    }

    return newProfile as UserProfile
  }

  // Update existing profile
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('auth_id', authId)
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    throw new Error(error.message || 'Failed to update user profile')
  }

  if (!data) {
    throw new Error('No data returned from profile update')
  }

  return data as UserProfile
}

/**
 * Uploads a profile picture to Supabase Storage
 */
export async function uploadProfilePicture(
  authId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be less than 5MB')
  }

  // Create unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${authId}-${Date.now()}.${fileExt}`
  const filePath = `profile-pictures/${fileName}`

  // Upload to Supabase Storage
  // NOTE: Make sure your bucket name matches exactly what you created
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('ProfilePictures') // This must match your bucket name exactly
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new Error(uploadError.message || 'Failed to upload profile picture')
  }

  if (!uploadData) {
    throw new Error('No data returned from upload')
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('ProfilePictures')
    .getPublicUrl(filePath)

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded image')
  }

  return urlData.publicUrl
}

/**
 * Deletes a profile picture from Supabase Storage
 */
export async function deleteProfilePicture(authId: string): Promise<void> {
  const supabase = createClient()

  // Get current profile to find the picture URL
  const profile = await getUserProfileClient(authId)

  if (!profile?.profile_picture_url) {
    return // Nothing to delete
  }

  // Extract file path from URL
  const url = new URL(profile.profile_picture_url)
  const pathParts = url.pathname.split('/ProfilePictures/')

  if (pathParts.length < 2) {
    console.error('Invalid profile picture URL format')
    return
  }

  const filePath = pathParts[1]

  // Delete from storage
  const { error } = await supabase.storage
    .from('ProfilePictures')
    .remove([`profile-pictures/${filePath}`])

  if (error) {
    console.error('Error deleting profile picture:', error)
    // Don't throw error here - we can still update the profile to remove the URL
  }
}

/**
 * Deletes a user profile completely
 */
export async function deleteUserProfile(authId: string): Promise<void> {
  const supabase = createClient()

  // First delete profile picture if it exists
  try {
    await deleteProfilePicture(authId)
  } catch (error) {
    console.error(
      'Error deleting profile picture during profile deletion:',
      error
    )
  }

  // Delete user profile
  const { error } = await supabase.from('users').delete().eq('auth_id', authId)

  if (error) {
    console.error('Error deleting user profile:', error)
    throw new Error(error.message || 'Failed to delete user profile')
  }
}

/**
 * Checks if a username is available
 */
export async function checkUsernameAvailability(
  username: string,
  excludeAuthId?: string
): Promise<boolean> {
  const supabase = createClient()

  let query = supabase.from('users').select('id').eq('username', username)

  if (excludeAuthId) {
    query = query.neq('auth_id', excludeAuthId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error checking username:', error)
    return false
  }

  return !data // True if username is available (no data found)
}
