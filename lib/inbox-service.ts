// File: lib/inbox-service.ts
import { createClient } from './supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface InboxMessage {
  id: string
  sender_id: string
  recipient_id: string
  category_name: string
  category_url: string
  note: string | null
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface InboxMessageWithSender extends InboxMessage {
  sender_username: string
  sender_full_name: string | null
  sender_profile_picture: string | null
  sender_email: string
}

export interface SendMessageParams {
  recipientId: string
  categoryName: string
  categoryUrl: string
  note?: string
}

/**
 * Get all inbox messages for a user
 */
export async function getInboxMessages(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  }
): Promise<InboxMessageWithSender[]> {
  const supabase = createClient()

  let query = supabase
    .from('inbox_messages_with_sender')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching inbox messages:', error)
    throw new Error('Failed to fetch inbox messages')
  }

  return (data || []) as InboxMessageWithSender[]
}

/**
 * Get unread message count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_unread_inbox_count', {
    user_id: userId,
  })

  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }

  return data || 0
}

/**
 * Send a category share message
 */
export async function sendCategoryShare(
  senderId: string,
  params: SendMessageParams
): Promise<InboxMessage> {
  const supabase = createClient()

  // Validate note length
  if (params.note && params.note.length > 100) {
    throw new Error('Note must be 100 characters or less')
  }

  // Validate not sending to self
  if (senderId === params.recipientId) {
    throw new Error('Cannot send messages to yourself')
  }

  const { data, error } = await supabase
    .from('inbox_messages')
    .insert({
      sender_id: senderId,
      recipient_id: params.recipientId,
      category_name: params.categoryName,
      category_url: params.categoryUrl,
      note: params.note || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message')
  }

  return data as InboxMessage
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(
  messageId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('mark_message_as_read', {
    message_id: messageId,
    user_id: userId,
  })

  if (error) {
    console.error('Error marking message as read:', error)
    return false
  }

  return data || false
}

/**
 * Mark all messages as read
 */
export async function markAllMessagesAsRead(userId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('mark_all_messages_as_read', {
    user_id: userId,
  })

  if (error) {
    console.error('Error marking all messages as read:', error)
    return 0
  }

  return data || 0
}

/**
 * Delete a message
 */
export async function deleteInboxMessage(
  messageId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('delete_inbox_message', {
    message_id: messageId,
    user_id: userId,
  })

  if (error) {
    console.error('Error deleting message:', error)
    return false
  }

  return data || false
}

/**
 * Get sent messages (messages user sent to others)
 */
export async function getSentMessages(
  userId: string,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<InboxMessageWithSender[]> {
  const supabase = createClient()

  let query = supabase
    .from('inbox_messages_with_sender')
    .select('*')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching sent messages:', error)
    throw new Error('Failed to fetch sent messages')
  }

  return (data || []) as InboxMessageWithSender[]
}

/**
 * Subscribe to new inbox messages (Realtime)
 */
export function subscribeToInboxMessages(
  userId: string,
  onNewMessage: (message: InboxMessage) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel('inbox_messages_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'inbox_messages',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        console.log('📬 New inbox message received:', payload)
        onNewMessage(payload.new as InboxMessage)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to message updates (when marked as read)
 */
export function subscribeToMessageUpdates(
  userId: string,
  onMessageUpdate: (message: InboxMessage) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel('inbox_messages_updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'inbox_messages',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        console.log('🔄 Inbox message updated:', payload)
        onMessageUpdate(payload.new as InboxMessage)
      }
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from realtime updates
 */
export async function unsubscribeFromInbox(channel: RealtimeChannel) {
  await channel.unsubscribe()
}

/**
 * Search users for sharing (exclude self)
 */
export async function searchUsersForSharing(
  query: string,
  currentUserId: string,
  limit: number = 20
): Promise<Array<{
  id: string
  username: string
  full_name: string | null
  profile_picture_url: string | null
}>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, profile_picture_url')
    .neq('id', currentUserId)
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Error searching users:', error)
    throw new Error('Failed to search users')
  }

  return data || []
}

/**
 * Get message by ID with sender details
 */
export async function getMessageById(
  messageId: string,
  userId: string
): Promise<InboxMessageWithSender | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('inbox_messages_with_sender')
    .select('*')
    .eq('id', messageId)
    .eq('recipient_id', userId)
    .single()

  if (error) {
    console.error('Error fetching message:', error)
    return null
  }

  return data as InboxMessageWithSender
}

/**
 * Check if user has any unread messages
 */
export async function hasUnreadMessages(userId: string): Promise<boolean> {
  const count = await getUnreadCount(userId)
  return count > 0
}