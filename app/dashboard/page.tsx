'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import BookmarkManager from '@/components/bookmark-manager'

export default function DashboardPage() {
  const router = useRouter()
  const { user, dbUser, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('🏠 Dashboard page mounted')
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check for recovery token
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const searchParams = new URLSearchParams(window.location.search)
      const isRecovery =
        hash.includes('type=recovery') ||
        searchParams.get('type') === 'recovery'

      if (isRecovery) {
        console.log('🔐 Recovery token detected, redirecting...')
        router.replace('/auth/reset-password')
        return
      }
    }

    console.log('📊 Dashboard state:', {
      mounted,
      isLoading,
      hasUser: !!user,
      userId: user?.id,
      hasDbUser: !!dbUser,
      dbUserId: dbUser?.id,
    })

    // Redirect if no user and not loading
    if (!isLoading && !user) {
      console.log('🔒 No user, redirecting to home')
      router.replace('/')
    }
  }, [mounted, isLoading, user, dbUser, router])

  // Show loading if not mounted OR still loading
  if (!mounted || isLoading) {
    console.log('⏳ Loading:', { mounted, isLoading })
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
          <p style={{ color: '#5f462d' }} className="text-lg">
            Loading your bookmarks...
          </p>
        </div>
      </div>
    )
  }

  // No user after loading
  if (!user) {
    console.log('❌ No user, returning null')
    return null
  }

  // Render dashboard
  console.log('✅ Rendering dashboard for:', user.id)
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      {/* Added proper padding to account for fixed navbar */}
      <div className="pt-20">
        <BookmarkManager userId={user.id} />
      </div>
    </div>
  )
}
