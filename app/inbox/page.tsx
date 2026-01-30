// File: app/inbox/page.tsx (UPDATED - Mark as read when viewing shared category)
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import {
  Mail,
  MailOpen,
  ExternalLink,
  Trash2,
  Send,
  CheckCheck,
  Clock,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import {
  getInboxMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteInboxMessage,
  subscribeToInboxMessages,
  subscribeToMessageUpdates,
  unsubscribeFromInbox,
  type InboxMessageWithSender,
} from '@/lib/inbox-service'
import {
  getInboxMessageReactions,
  toggleInboxMessageReaction,
  subscribeToInboxMessageReactions,
  type Reaction,
} from '@/lib/reactions-service'
import { ShareCategoryModal } from '@/components/share-category-modal'
import { ReactionPicker } from '@/components/reaction-picker'
import { ReactionDisplay } from '@/components/reaction-display'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function InboxPage() {
  const router = useRouter()
  const { dbUser, isLoading: authLoading } = useAuth()

  const [messages, setMessages] = useState<InboxMessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [showShareModal, setShowShareModal] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [newMessageAnimation, setNewMessageAnimation] = useState<string | null>(
    null,
  )

  // Reactions state
  const [messageReactions, setMessageReactions] = useState<
    Record<string, Reaction[]>
  >({})
  const [reactionChannels, setReactionChannels] = useState<
    Record<string, RealtimeChannel>
  >({})

  // Use refs to track channels
  const newMessageChannelRef = useRef<RealtimeChannel | null>(null)
  const updateChannelRef = useRef<RealtimeChannel | null>(null)

  // Memoized fetch function
  const fetchMessages = useCallback(async () => {
    if (!dbUser?.id) {
      console.log('🔍 [InboxPage] Cannot fetch - no user ID')
      return
    }

    console.log('📬 [InboxPage] Fetching messages...', {
      userId: dbUser.id,
      filter,
    })

    try {
      setLoading(true)
      const data = await getInboxMessages(dbUser.id, {
        unreadOnly: filter === 'unread',
      })
      console.log('✅ [InboxPage] Fetched', data.length, 'messages')
      setMessages(data)

      // Fetch reactions for all messages
      if (data.length > 0) {
        fetchAllReactions(data.map((m) => m.id))
      }
    } catch (error) {
      console.error('❌ [InboxPage] Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [dbUser?.id, filter])

  // Fetch reactions for all messages
  const fetchAllReactions = async (messageIds: string[]) => {
    if (!dbUser?.id) return

    const reactionsMap: Record<string, Reaction[]> = {}

    for (const messageId of messageIds) {
      const reactions = await getInboxMessageReactions(messageId, dbUser.id)
      reactionsMap[messageId] = reactions
    }

    setMessageReactions(reactionsMap)
  }

  // Setup realtime for reactions
  const setupReactionRealtime = (messageId: string) => {
    if (reactionChannels[messageId]) return // Already subscribed

    const channel = subscribeToInboxMessageReactions(messageId, async () => {
      if (!dbUser?.id) return
      const reactions = await getInboxMessageReactions(messageId, dbUser.id)
      setMessageReactions((prev) => ({
        ...prev,
        [messageId]: reactions,
      }))
    })

    setReactionChannels((prev) => ({
      ...prev,
      [messageId]: channel,
    }))
  }

  // Handle reaction toggle
  const handleReactionToggle = async (messageId: string, emoji: string) => {
    if (!dbUser?.id) return

    try {
      await toggleInboxMessageReaction(messageId, dbUser.id, emoji)

      // Immediately refetch reactions for this message
      const reactions = await getInboxMessageReactions(messageId, dbUser.id)
      setMessageReactions((prev) => ({
        ...prev,
        [messageId]: reactions,
      }))
    } catch (error) {
      console.error('❌ Error toggling reaction:', error)
    }
  }

  // ✅ NEW: Handle viewing shared category (mark as read)
  const handleViewCategory = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    messageId: string,
    isRead: boolean,
  ) => {
    // Don't prevent default - allow link to open
    // But if message is unread, mark it as read

    if (!isRead && dbUser?.id) {
      console.log(
        '👁️ [InboxPage] User viewing category - marking as read:',
        messageId,
      )

      // INSTANT optimistic update - mark as read in UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg,
        ),
      )

      // Mark as read on server (fire and forget for better UX)
      markMessageAsRead(messageId, dbUser.id).catch((error) => {
        console.error('❌ Error marking message as read:', error)
        // Revert on error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, is_read: false } : msg,
          ),
        )
      })
    }
  }

  // Initial fetch
  useEffect(() => {
    if (!authLoading && !dbUser) {
      console.log('🔍 [InboxPage] No user, redirecting...')
      router.replace('/auth/login')
      return
    }

    if (dbUser?.id) {
      console.log('✅ [InboxPage] User detected, fetching messages')
      fetchMessages()
    }
  }, [dbUser, authLoading, filter, router, fetchMessages])

  // Realtime subscriptions - INSTANT UPDATES
  useEffect(() => {
    if (!dbUser?.id) return

    console.log('🔔 [InboxPage] Setting up realtime...')

    // Cleanup old subscriptions
    if (newMessageChannelRef.current) {
      unsubscribeFromInbox(newMessageChannelRef.current)
    }
    if (updateChannelRef.current) {
      unsubscribeFromInbox(updateChannelRef.current)
    }

    // Subscribe to NEW messages
    newMessageChannelRef.current = subscribeToInboxMessages(
      dbUser.id,
      (newMessage) => {
        console.log('📨 [InboxPage] New message via Realtime!', newMessage)

        // INSTANT optimistic update - add to list immediately
        fetchMessages()

        // Trigger animation
        setNewMessageAnimation(newMessage.id)
        setTimeout(() => setNewMessageAnimation(null), 2000)

        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Category Share! 🎉', {
            body: 'Someone shared a category with you',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          })
        }
      },
    )

    // Subscribe to message UPDATES (mark as read, delete, etc)
    updateChannelRef.current = subscribeToMessageUpdates(
      dbUser.id,
      (updatedMessage) => {
        console.log(
          '🔄 [InboxPage] Message updated via Realtime!',
          updatedMessage,
        )

        // INSTANT optimistic update
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg,
          ),
        )
      },
    )

    console.log('✅ [InboxPage] Realtime subscriptions active')

    return () => {
      console.log('🧹 [InboxPage] Cleaning up realtime')
      if (newMessageChannelRef.current) {
        unsubscribeFromInbox(newMessageChannelRef.current)
      }
      if (updateChannelRef.current) {
        unsubscribeFromInbox(updateChannelRef.current)
      }

      // Cleanup reaction channels
      Object.values(reactionChannels).forEach((channel) => {
        channel.unsubscribe()
      })
    }
  }, [dbUser?.id, fetchMessages])

  // Setup reaction realtime for visible messages
  useEffect(() => {
    messages.forEach((message) => {
      setupReactionRealtime(message.id)
    })
  }, [messages])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('🔔 Notification permission:', permission)
      })
    }
  }, [])

  // Handle mark as read with INSTANT UI update
  const handleMarkAsRead = async (messageId: string) => {
    if (!dbUser?.id) return

    console.log('✅ [InboxPage] Manually marking as read:', messageId)
    setProcessing(messageId)

    // INSTANT optimistic update
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, is_read: true } : msg,
      ),
    )

    try {
      const success = await markMessageAsRead(messageId, dbUser.id)
      if (!success) {
        // Revert on failure
        console.error('❌ Failed to mark as read, reverting')
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, is_read: false } : msg,
          ),
        )
      }
    } catch (error) {
      console.error('❌ Error marking as read:', error)
      // Revert on error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: false } : msg,
        ),
      )
    } finally {
      setProcessing(null)
    }
  }

  // Handle mark all as read with INSTANT UI update
  const handleMarkAllAsRead = async () => {
    if (!dbUser?.id) return

    console.log('✅ [InboxPage] Manually marking all as read')
    setProcessing('all')

    // INSTANT optimistic update
    setMessages((prev) => prev.map((msg) => ({ ...msg, is_read: true })))

    try {
      await markAllMessagesAsRead(dbUser.id)
    } catch (error) {
      console.error('❌ Error marking all as read:', error)
      // Revert on error
      fetchMessages()
    } finally {
      setProcessing(null)
    }
  }

  // Handle delete with INSTANT UI update
  const handleDelete = async (messageId: string) => {
    if (!dbUser?.id) return
    if (!confirm('Are you sure you want to delete this message?')) return

    console.log('🗑️  [InboxPage] Deleting:', messageId)
    setProcessing(messageId)

    // INSTANT optimistic update
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))

    try {
      const success = await deleteInboxMessage(messageId, dbUser.id)
      if (!success) {
        // Revert on failure
        console.error('❌ Failed to delete, reverting')
        fetchMessages()
      }
    } catch (error) {
      console.error('❌ Error deleting:', error)
      // Revert on error
      fetchMessages()
    } finally {
      setProcessing(null)
    }
  }

  const getInitials = (message: InboxMessageWithSender) => {
    const name = message.sender_full_name || message.sender_username
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const unreadCount = messages.filter((m) => !m.is_read).length

  if (authLoading || !dbUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#5f462d' }}
          />
          <p style={{ color: '#5f462d' }}>Loading inbox...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-8 pt-24"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: '#5f462d' }} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#5f462d' }}>
                📬 Inbox
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread message${
                      unreadCount !== 1 ? 's' : ''
                    }`
                  : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold transition-all hover:shadow-lg hover:scale-105"
            style={{ background: '#5f462d' }}
          >
            <Send className="w-4 h-4" />
            Share Category
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={filter === 'all' ? { background: '#5f462d' } : {}}
            >
              All Messages
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'unread'
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={filter === 'unread' ? { background: '#5f462d' } : {}}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={processing === 'all'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-all hover:scale-105 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#5f462d' }}
            />
            <p className="text-gray-600">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">
              {filter === 'unread' ? '✅' : '📭'}
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#5f462d' }}>
              {filter === 'unread'
                ? "You're all caught up!"
                : 'No Messages Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'unread'
                ? "You've read all your messages"
                : "You haven't received any category shares yet"}
            </p>
            <button
              onClick={() => setShowShareModal(true)}
              className="px-6 py-3 rounded-lg text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
              style={{ background: '#5f462d' }}
            >
              Share a Category
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${
                  !message.is_read ? 'border-l-4' : ''
                } ${
                  newMessageAnimation === message.id
                    ? 'animate-pulse ring-4 ring-green-400'
                    : ''
                }`}
                style={!message.is_read ? { borderColor: '#5f462d' } : {}}
              >
                <div className="flex items-start gap-4">
                  {/* Sender Avatar */}
                  <div className="flex-shrink-0">
                    {message.sender_profile_picture ? (
                      <img
                        src={message.sender_profile_picture}
                        alt={message.sender_username}
                        className="w-12 h-12 rounded-full object-cover border-2"
                        style={{ borderColor: '#5f462d' }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2"
                        style={{
                          background: '#5f462d',
                          borderColor: '#5f462d',
                        }}
                      >
                        {getInitials(message)}
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {message.sender_full_name ||
                              message.sender_username}
                          </span>
                          {!message.is_read && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span>@{message.sender_username}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(message.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!message.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(message.id)}
                            disabled={processing === message.id}
                            className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-all hover:scale-110 disabled:opacity-50"
                            title="Mark as read"
                          >
                            <MailOpen className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(message.id)}
                          disabled={processing === message.id}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-all hover:scale-110 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Shared Category - ✅ UPDATED: Mark as read on click */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Shared Category:
                          </p>
                          <p className="font-semibold text-gray-900">
                            {message.category_name}
                          </p>
                        </div>
                        <a
                          href={message.category_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) =>
                            handleViewCategory(e, message.id, message.is_read)
                          }
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all hover:shadow-md hover:scale-105"
                          style={{ background: '#5f462d' }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    </div>

                    {/* Note */}
                    {message.note && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-3">
                        <p className="text-sm text-gray-700 italic">
                          "{message.note}"
                        </p>
                      </div>
                    )}

                    {/* Reactions Section */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      <ReactionPicker
                        onSelect={(emoji) =>
                          handleReactionToggle(message.id, emoji)
                        }
                      />

                      {messageReactions[message.id] &&
                        messageReactions[message.id].length > 0 && (
                          <ReactionDisplay
                            reactions={messageReactions[message.id]}
                            onReactionClick={(emoji) =>
                              handleReactionToggle(message.id, emoji)
                            }
                          />
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ShareCategoryModal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        currentUserId={dbUser.id}
      />
    </div>
  )
}
