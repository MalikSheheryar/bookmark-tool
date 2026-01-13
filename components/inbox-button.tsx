// File: components/inbox-button.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import {
  getUnreadCount,
  subscribeToInboxMessages,
  unsubscribeFromInbox,
} from '@/lib/inbox-service'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface InboxButtonProps {
  userId: string
}

export function InboxButton({ userId }: InboxButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch initial unread count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getUnreadCount(userId)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchCount()
    }
  }, [userId])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return

    let channel: RealtimeChannel

    const setupRealtime = async () => {
      channel = subscribeToInboxMessages(userId, () => {
        // New message received, increment count
        setUnreadCount((prev) => prev + 1)
      })
    }

    setupRealtime()

    return () => {
      if (channel) {
        unsubscribeFromInbox(channel)
      }
    }
  }, [userId])

  // Poll for updates every 30 seconds as fallback
  useEffect(() => {
    if (!userId) return

    const interval = setInterval(async () => {
      try {
        const count = await getUnreadCount(userId)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error polling unread count:', error)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [userId])

  return (
    <Link
      href="/inbox"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all hover:bg-white/50 relative"
      style={{ color: '#5f462d' }}
      title="Inbox"
    >
      <div className="relative">
        <Mail className="w-5 h-5" />
        {!loading && unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      <span className="hidden lg:inline">Inbox</span>
    </Link>
  )
}
