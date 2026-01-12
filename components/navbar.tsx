'use client'

import { useAuth } from '@/components/auth-provider'
import { ProfileSearch } from '@/components/profile-search'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, User, Bookmark } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
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

  const isAuthPage = pathname?.startsWith('/auth/')
  const isDemoPage = pathname === '/demo'

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        borderColor: '#5f462d',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center gap-4">
          {/* Brand */}
          <Link
            href={user ? '/dashboard' : '/'}
            className="font-bold text-2xl flex items-center gap-2 flex-shrink-0"
            style={{ color: '#5f462d' }}
          >
            <Bookmark className="w-6 h-6" />
            <span className="hidden sm:inline">Bookmarks</span>
          </Link>

          {/* Search Bar - Center on desktop, full width on mobile */}
          {!isAuthPage && (
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <ProfileSearch />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 items-center flex-shrink-0">
            {isLoading ? (
              <div
                className="w-8 h-8 rounded-full animate-pulse"
                style={{ background: '#5f462d' }}
              ></div>
            ) : user ? (
              <>
                {!isDemoPage && (
                  <Link
                    href="/dashboard"
                    className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                    style={{
                      color: '#5f462d',
                      borderColor: '#5f462d',
                      border: '2px solid',
                    }}
                  >
                    <Bookmark className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
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
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: '#5f462d' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                {!isAuthPage && (
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
                      <span className="hidden sm:inline">Sign In</span>
                      <span className="sm:hidden">Login</span>
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
              </>
            )}
          </div>
        </div>

        {/* Mobile Search Bar - Below on mobile */}
        {!isAuthPage && (
          <div className="mt-3 md:hidden">
            <ProfileSearch />
          </div>
        )}
      </div>
    </nav>
  )
}
