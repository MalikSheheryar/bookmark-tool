// ============================================
// FILE: app/page.tsx
// Your updated homepage without the demo component
// ============================================

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { LogIn, UserPlus, Sparkles } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard')
    }
  }, [isLoading, user, router])

  if (isLoading) {
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
          <p style={{ color: '#5f462d' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      {/* Hero Section */}
      <header className="min-h-screen mt-10 flex items-center justify-center p-4 relative overflow-hidden pt-5">
        <div className="text-center max-w-2xl mx-auto z-10 pt-5">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" style={{ color: '#5f462d' }} />
            <span className="text-sm font-medium" style={{ color: '#5f462d' }}>
              Organize Your Digital Life
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6"
            style={{ color: '#5f462d' }}
          >
            Organize Your
            <br /> Links
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Keep track of your favourite websites with a modern, organized link
            manager. Sign in to save your links.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-white transition-all duration-200 hover:transform hover:scale-105 shadow-lg"
              style={{ background: '#5f462d' }}
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold border-2 transition-all duration-200 hover:transform hover:scale-105 bg-white/50"
              style={{ borderColor: '#5f462d', color: '#5f462d' }}
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </Link>
          </div>

          <div className="mb-8">
            <p className="text-gray-600 mb-4">Or try it without signing up:</p>
            <Link
              href="/demo"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
              style={{ background: '#7d5d3b' }}
            >
              Try Free Demo →
            </Link>
            <p className="text-sm text-gray-500 mt-3">
              Demo mode • No account needed • Data stored locally
            </p>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ color: '#5f462d' }}
          >
            Why Use Our Link Manager?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📁"
              title="Smart Categories"
              description="Organize your Links with custom categories and emojis"
            />
            <FeatureCard
              icon="⚡"
              title="Lightning Fast"
              description="Instant access to all your links"
            />
            <FeatureCard
              icon="🔄"
              title="Auto Sync"
              description="Sync your links across all your devices"
            />
            <FeatureCard
              icon="🎯"
              title="Intuitive Design"
              description="A clean, intuitive interface built for productivity"
            />
            <FeatureCard
              icon="🔒"
              title="Privacy First"
              description="Your links stay secure and private"
            />
            <FeatureCard
              icon="🚀"
              title="Drag & Drop"
              description="Easily reorder your links with drag and drop"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-2" style={{ color: '#5f462d' }}>
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
