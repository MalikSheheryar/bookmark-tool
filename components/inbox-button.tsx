// File: components/inbox-button.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import {
  getUnreadCount,
  subscribeToInboxMessages,
  subscribeToMessageUpdates,
  unsubscribeFromInbox,
} from '@/lib/inbox-service'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface InboxButtonProps {
  userId: string
}

export function InboxButton({ userId }: InboxButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [justUpdated, setJustUpdated] = useState(false)

  // Use refs to track channels and prevent duplicate subscriptions
  const newMessageChannelRef = useRef<RealtimeChannel | null>(null)
  const updateChannelRef = useRef<RealtimeChannel | null>(null)

  // Fetch unread count with caching
  const fetchCount = useCallback(async () => {
    try {
      const count = await getUnreadCount(userId)
      setUnreadCount(count)
      return count
    } catch (error) {
      console.error('❌ [InboxButton] Error fetching unread count:', error)
      return unreadCount // Return current count on error
    }
  }, [userId, unreadCount])

  // Initial fetch - runs immediately
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    console.log('📬 [InboxButton] Initial fetch for user:', userId)

    const initialFetch = async () => {
      setLoading(true)
      await fetchCount()
      setLoading(false)
    }

    initialFetch()
  }, [userId, fetchCount])

  // Realtime subscriptions for instant updates
  useEffect(() => {
    if (!userId) return

    console.log('🔔 [InboxButton] Setting up realtime subscriptions')

    // Cleanup previous subscriptions if they exist
    if (newMessageChannelRef.current) {
      unsubscribeFromInbox(newMessageChannelRef.current)
    }
    if (updateChannelRef.current) {
      unsubscribeFromInbox(updateChannelRef.current)
    }

    // Subscribe to NEW messages (increment count)
    newMessageChannelRef.current = subscribeToInboxMessages(
      userId,
      (newMessage) => {
        console.log('📨 [InboxButton] New message received!', newMessage)

        // INSTANT optimistic update
        setUnreadCount((prev) => prev + 1)
        setJustUpdated(true)

        // Flash animation
        setTimeout(() => setJustUpdated(false), 1000)

        // Verify with server after 500ms
        setTimeout(fetchCount, 500)
      },
    )

    // Subscribe to message UPDATES (when marked as read, decrement count)
    updateChannelRef.current = subscribeToMessageUpdates(
      userId,
      (updatedMessage) => {
        console.log('✅ [InboxButton] Message updated:', updatedMessage)

        // If message was marked as read
        if (updatedMessage.is_read) {
          // INSTANT optimistic update
          setUnreadCount((prev) => Math.max(0, prev - 1))

          // Verify with server after 500ms
          setTimeout(fetchCount, 500)
        }
      },
    )

    console.log('✅ [InboxButton] Realtime subscriptions active')

    // Cleanup on unmount
    return () => {
      console.log('🧹 [InboxButton] Cleaning up subscriptions')
      if (newMessageChannelRef.current) {
        unsubscribeFromInbox(newMessageChannelRef.current)
      }
      if (updateChannelRef.current) {
        unsubscribeFromInbox(updateChannelRef.current)
      }
    }
  }, [userId, fetchCount])

  // Aggressive polling as backup (every 10 seconds instead of 30)
  useEffect(() => {
    if (!userId) return

    console.log('⏱️  [InboxButton] Starting background polling')

    const interval = setInterval(async () => {
      await fetchCount()
    }, 10000) // 10 seconds - more aggressive

    return () => {
      console.log('🧹 [InboxButton] Stopping background polling')
      clearInterval(interval)
    }
  }, [userId, fetchCount])

  // Refetch when tab becomes visible (handles user switching tabs)
  useEffect(() => {
    if (!userId) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️  [InboxButton] Tab visible, refreshing count')
        fetchCount()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, fetchCount])

  return (
    <Link
      href="/inbox"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all hover:bg-white/50 relative group"
      style={{ color: '#5f462d', cursor: 'pointer', zIndex: 10 }}
      title={`Inbox${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
      onClick={() => {
        console.log('📬 [InboxButton] User navigating to inbox')
      }}
    >
      <div className="relative">
        <Mail
          className={`w-5 h-5 transition-transform ${
            justUpdated ? 'scale-125' : 'scale-100'
          }`}
        />

        {!loading && unreadCount > 0 && (
          <span
            className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-lg transition-all duration-200 ${
              justUpdated ? 'scale-125 animate-bounce' : 'scale-100'
            }`}
            style={{
              animation: justUpdated ? 'pulse 0.5s ease-in-out' : 'none',
              pointerEvents: 'none', // Badge shouldn't block clicks
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      <span className="hidden lg:inline group-hover:underline">Inbox</span>
    </Link>
  )
}
