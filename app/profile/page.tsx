'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import ProfileView from '@/components/profile-view'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.replace('/auth/login')
    }
  }, [mounted, isLoading, user, router])

  if (!mounted || isLoading || !user) {
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
          ></div>
          <p style={{ color: '#5f462d' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <main
      className="min-h-screen pt-20"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      <ProfileView userId={user.id} userEmail={user.email} />
    </main>
  )
}
