// File: lib/account-deletion-service.ts
import { createClient } from './supabase-client'
import { signOut } from './auth'

/**
 * Permanently deletes user account and all associated data
 */
export async function deleteUserAccount(authId: string): Promise<void> {
  const supabase = createClient()

  console.log('🗑️ Starting account deletion for auth_id:', authId)

  try {
    // Step 1: Get user's database ID and profile picture URL
    console.log('📋 Step 1: Fetching user data by auth_id...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, profile_picture_url')
      .eq('auth_id', authId) // ✅ Query by auth_id
      .single()

    if (userError) {
      console.error('❌ Error fetching user data:', userError)
      throw new Error('Failed to fetch user data: ' + userError.message)
    }

    if (!userData) {
      throw new Error('User not found')
    }

    const userId = userData.id // ✅ Get the database UUID
    const profilePictureUrl = userData.profile_picture_url

    console.log('✅ User data fetched:', { authId, userId })

    // Step 2: Delete profile picture from storage
    if (profilePictureUrl) {
      console.log('🖼️ Step 2: Deleting profile picture...')
      try {
        const url = new URL(profilePictureUrl)
        const pathParts = url.pathname.split('/ProfilePictures/')

        if (pathParts.length >= 2) {
          const filePath = pathParts[1]
          const { error: storageError } = await supabase.storage
            .from('ProfilePictures')
            .remove([`profile-pictures/${filePath}`])

          if (storageError) {
            console.warn('⚠️ Profile picture deletion warning:', storageError)
          } else {
            console.log('✅ Profile picture deleted')
          }
        }
      } catch (error) {
        console.warn('⚠️ Error deleting profile picture:', error)
      }
    }

    // Step 3: Delete inbox message reactions
    console.log('💬 Step 3: Deleting inbox message reactions...')
    const { error: msgReactionsError } = await supabase
      .from('inbox_message_reactions')
      .delete()
      .eq('user_id', userId)

    if (msgReactionsError) {
      console.warn('⚠️ Message reactions deletion warning:', msgReactionsError)
    } else {
      console.log('✅ Message reactions deleted')
    }

    // Step 4: Delete category reactions
    console.log('😊 Step 4: Deleting category reactions...')
    const { error: catReactionsError } = await supabase
      .from('category_reactions')
      .delete()
      .eq('user_id', userId)

    if (catReactionsError) {
      console.warn('⚠️ Category reactions deletion warning:', catReactionsError)
    } else {
      console.log('✅ Category reactions deleted')
    }

    // Step 5: Delete inbox messages (sent and received)
    console.log('📨 Step 5: Deleting inbox messages...')
    const { error: sentMessagesError } = await supabase
      .from('inbox_messages')
      .delete()
      .eq('sender_id', userId)

    if (sentMessagesError) {
      console.warn('⚠️ Sent messages deletion warning:', sentMessagesError)
    }

    const { error: receivedMessagesError } = await supabase
      .from('inbox_messages')
      .delete()
      .eq('recipient_id', userId)

    if (receivedMessagesError) {
      console.warn(
        '⚠️ Received messages deletion warning:',
        receivedMessagesError,
      )
    } else {
      console.log('✅ Inbox messages deleted')
    }

    // Step 6: Delete bookmarks
    console.log('🔖 Step 6: Deleting bookmarks...')
    const { error: bookmarksError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)

    if (bookmarksError) {
      console.warn('⚠️ Bookmarks deletion warning:', bookmarksError)
    } else {
      console.log('✅ Bookmarks deleted')
    }

    // Step 7: Delete categories
    console.log('📁 Step 7: Deleting categories...')
    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId)

    if (categoriesError) {
      console.warn('⚠️ Categories deletion warning:', categoriesError)
    } else {
      console.log('✅ Categories deleted')
    }

    // Step 8: Delete notification settings
    console.log('🔔 Step 8: Deleting notification settings...')
    const { error: notificationError } = await supabase
      .from('notification_settings')
      .delete()
      .eq('user_id', userId)

    if (notificationError) {
      console.warn(
        '⚠️ Notification settings deletion warning:',
        notificationError,
      )
    } else {
      console.log('✅ Notification settings deleted')
    }

    // Step 9: Delete subscription history
    console.log('💳 Step 9: Deleting subscription history...')
    const { error: subscriptionError } = await supabase
      .from('subscription_history')
      .delete()
      .eq('user_id', userId)

    if (subscriptionError) {
      console.warn(
        '⚠️ Subscription history deletion warning:',
        subscriptionError,
      )
    } else {
      console.log('✅ Subscription history deleted')
    }

    // Step 10: Delete user profile
    console.log('👤 Step 10: Deleting user profile...')
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('auth_id', authId) // ✅ Delete by auth_id

    if (userDeleteError) {
      console.error('❌ User profile deletion error:', userDeleteError)
      throw new Error(
        'Failed to delete user profile: ' + userDeleteError.message,
      )
    }

    console.log('✅ User profile deleted')

    // Step 11: Delete auth account (if RPC function exists)
    console.log('🔐 Step 11: Attempting to delete auth account...')
    try {
      const { error: authDeleteError } = await supabase.rpc(
        'delete_auth_user',
        {
          target_user_id: authId,
        },
      )

      if (authDeleteError) {
        console.warn('⚠️ Auth deletion warning:', authDeleteError)
      } else {
        console.log('✅ Auth account deleted')
      }
    } catch (error) {
      console.warn('⚠️ Auth deletion not available (RPC may not exist):', error)
    }

    // Step 12: Sign out
    console.log('🚪 Step 12: Signing out...')
    await signOut()

    console.log('✅✅✅ Account deletion complete!')
  } catch (error) {
    console.error('❌ CRITICAL ERROR during account deletion:', error)
    throw error
  }
}

/**
 * Check if user has premium subscription before deletion
 */
export async function checkSubscriptionBeforeDeletion(authId: string): Promise<{
  hasPremium: boolean
  subscriptionStatus: string | null
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier, subscription_status')
    .eq('auth_id', authId)
    .single()

  if (error) {
    console.error('Error checking subscription:', error)
    return { hasPremium: false, subscriptionStatus: null }
  }

  return {
    hasPremium: data.subscription_tier === 'premium',
    subscriptionStatus: data.subscription_status,
  }
}
