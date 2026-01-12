'use client'

import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        borderColor: '#5f462d',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          href={user ? '/dashboard' : '/'}
          className="font-bold text-2xl"
          style={{ color: '#5f462d' }}
        >
          📚 Bookmarks
        </Link>

        <div className="flex gap-4 items-center">
          {isLoading ? (
            <div
              className="w-8 h-8 rounded-full animate-pulse"
              style={{ background: '#5f462d' }}
            ></div>
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  color: '#5f462d',
                  borderColor: '#5f462d',
                  border: '2px solid',
                }}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-all duration-200 hover:opacity-90"
                style={{ background: '#5f462d' }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  color: '#5f462d',
                  borderColor: '#5f462d',
                  border: '2px solid',
                }}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-lg font-bold text-white transition-all duration-200 hover:opacity-90"
                style={{ background: '#5f462d' }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
