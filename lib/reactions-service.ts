// File: lib/reactions-service.ts (UPDATED for Single Reaction)
import { createClient } from './supabase-client'

// ============================================
// TYPES
// ============================================

export interface Reaction {
  emoji: string
  count: number
  usernames: string[]
  hasReacted?: boolean // Whether current user has reacted
}

export interface InboxMessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface CategoryReaction {
  id: string
  category_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface ReactionToggleResult {
  action: 'added' | 'removed' | 'replaced'
  emoji: string
  previous_emoji?: string | null
}

// Available emoji set (reactions)
export const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'Heart' }, // ← added first
  { emoji: '🔥', label: 'Fire' },
  { emoji: '😂', label: 'Tears of Joy' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '😍', label: 'Heart Eyes' },
  { emoji: '👀', label: 'Eyes' },
  { emoji: '💯', label: 'Hundred' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🤯', label: 'Mind Blown' },
  { emoji: '🙌', label: 'Celebrate' },
  { emoji: '🤝', label: 'Handshake' },
  { emoji: '🎯', label: 'Direct Hit' },
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '👻', label: 'Ghost' },
  { emoji: '🙏', label: 'Thanks' },
  { emoji: '🫡', label: 'Salute' },
  { emoji: '😈', label: 'Devilish' },
  { emoji: '🎉', label: 'Party' },
]

// ============================================
// INBOX MESSAGE REACTIONS
// ============================================

/**
 * Toggle reaction on an inbox message
 * User can only have ONE active reaction at a time
 * - If clicking same emoji: removes it
 * - If clicking different emoji: replaces current reaction
 * - If no reaction exists: adds the new one
 */
export async function toggleInboxMessageReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<ReactionToggleResult> {
  const supabase = createClient()

  console.log('🎯 Toggle inbox message reaction:', { messageId, userId, emoji })

  const { data, error } = await supabase.rpc('toggle_inbox_message_reaction', {
    p_message_id: messageId,
    p_user_id: userId,
    p_emoji: emoji,
  })

  if (error) {
    console.error('❌ Error toggling reaction:', error)
    throw new Error('Failed to toggle reaction')
  }

  const result: ReactionToggleResult = {
    action: data.action,
    emoji: data.emoji,
    previous_emoji: data.previous_emoji,
  }

  console.log('✅ Reaction toggled:', result)

  // Log user-friendly message
  if (result.action === 'replaced') {
    console.log(`🔄 Replaced ${result.previous_emoji} with ${result.emoji}`)
  } else if (result.action === 'added') {
    console.log(`➕ Added ${result.emoji}`)
  } else {
    console.log(`➖ Removed ${result.emoji}`)
  }

  return result
}

/**
 * Get all reactions for an inbox message
 * Includes whether current user has reacted and with which emoji
 */
export async function getInboxMessageReactions(
  messageId: string,
  currentUserId?: string
): Promise<Reaction[]> {
  const supabase = createClient()

  console.log('📊 Fetching inbox message reactions:', messageId)

  const { data, error } = await supabase.rpc('get_inbox_message_reactions', {
    p_message_id: messageId,
  })

  if (error) {
    console.error('❌ Error fetching reactions:', error)
    return []
  }

  // If no reactions
  if (!data || data.length === 0) {
    return []
  }

  // Check which emoji the current user has reacted with (if any)
  let userReactionEmoji: string | null = null
  if (currentUserId) {
    const { data: userReactionData } = await supabase
      .from('inbox_message_reactions')
      .select('emoji')
      .eq('message_id', messageId)
      .eq('user_id', currentUserId)
      .single()

    userReactionEmoji = userReactionData?.emoji || null
  }

  const reactions: Reaction[] = data.map((r: any) => ({
    emoji: r.emoji,
    count: r.count,
    usernames: r.usernames || [],
    hasReacted: userReactionEmoji === r.emoji,
  }))

  console.log('✅ Reactions fetched:', reactions)
  console.log('👤 User reaction:', userReactionEmoji || 'none')

  return reactions
}

// ============================================
// CATEGORY REACTIONS (Public Profiles)
// ============================================

/**
 * Toggle reaction on a category
 * User can only have ONE active reaction at a time
 * Only works for public categories
 */
export async function toggleCategoryReaction(
  categoryId: string,
  userId: string,
  emoji: string
): Promise<ReactionToggleResult> {
  const supabase = createClient()

  console.log('🎯 Toggle category reaction:', { categoryId, userId, emoji })

  const { data, error } = await supabase.rpc('toggle_category_reaction', {
    p_category_id: categoryId,
    p_user_id: userId,
    p_emoji: emoji,
  })

  if (error) {
    console.error('❌ Error toggling category reaction:', error)
    throw new Error('Failed to toggle reaction')
  }

  const result: ReactionToggleResult = {
    action: data.action,
    emoji: data.emoji,
    previous_emoji: data.previous_emoji,
  }

  console.log('✅ Category reaction toggled:', result)

  // Log user-friendly message
  if (result.action === 'replaced') {
    console.log(`🔄 Replaced ${result.previous_emoji} with ${result.emoji}`)
  } else if (result.action === 'added') {
    console.log(`➕ Added ${result.emoji}`)
  } else {
    console.log(`➖ Removed ${result.emoji}`)
  }

  return result
}

/**
 * Get all reactions for a category
 * Includes whether current user has reacted and with which emoji
 */
export async function getCategoryReactions(
  categoryId: string,
  currentUserId?: string
): Promise<Reaction[]> {
  const supabase = createClient()

  console.log('📊 Fetching category reactions:', categoryId)

  const { data, error } = await supabase.rpc('get_category_reactions', {
    p_category_id: categoryId,
  })

  if (error) {
    console.error('❌ Error fetching category reactions:', error)
    return []
  }

  // If no reactions
  if (!data || data.length === 0) {
    return []
  }

  // Check which emoji the current user has reacted with (if any)
  let userReactionEmoji: string | null = null
  if (currentUserId) {
    const { data: userReactionData } = await supabase
      .from('category_reactions')
      .select('emoji')
      .eq('category_id', categoryId)
      .eq('user_id', currentUserId)
      .single()

    userReactionEmoji = userReactionData?.emoji || null
  }

  const reactions: Reaction[] = data.map((r: any) => ({
    emoji: r.emoji,
    count: r.count,
    usernames: r.usernames || [],
    hasReacted: userReactionEmoji === r.emoji,
  }))

  console.log('✅ Category reactions fetched:', reactions)
  console.log('👤 User reaction:', userReactionEmoji || 'none')

  return reactions
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to inbox message reactions changes
 */
export function subscribeToInboxMessageReactions(
  messageId: string,
  onReactionChange: () => void
) {
  const supabase = createClient()

  const channel = supabase
    .channel(`inbox_reactions_${messageId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inbox_message_reactions',
        filter: `message_id=eq.${messageId}`,
      },
      () => {
        console.log('🔄 Inbox message reaction changed')
        onReactionChange()
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to category reactions changes
 */
export function subscribeToCategoryReactions(
  categoryId: string,
  onReactionChange: () => void
) {
  const supabase = createClient()

  const channel = supabase
    .channel(`category_reactions_${categoryId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'category_reactions',
        filter: `category_id=eq.${categoryId}`,
      },
      () => {
        console.log('🔄 Category reaction changed')
        onReactionChange()
      }
    )
    .subscribe()

  return channel
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if emoji is in allowed list
 */
export function isValidEmoji(emoji: string): boolean {
  return REACTION_EMOJIS.some((e) => e.emoji === emoji)
}

/**
 * Get top N reactions sorted by count
 */
export function getTopReactions(
  reactions: Reaction[],
  limit: number = 3
): Reaction[] {
  return reactions.sort((a, b) => b.count - a.count).slice(0, limit)
}

/**
 * Get user's current reaction emoji for a message
 */
export async function getUserReactionForMessage(
  messageId: string,
  userId: string
): Promise<string | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('inbox_message_reactions')
    .select('emoji')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .single()

  return data?.emoji || null
}

/**
 * Get user's current reaction emoji for a category
 */
export async function getUserReactionForCategory(
  categoryId: string,
  userId: string
): Promise<string | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('category_reactions')
    .select('emoji')
    .eq('category_id', categoryId)
    .eq('user_id', userId)
    .single()

  return data?.emoji || null
}
