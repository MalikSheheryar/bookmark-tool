'use client'

import { useAuth } from '@/components/auth-provider'
import { ProfileSearch } from '@/components/profile-search'
import { InboxButton } from '@/components/inbox-button'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, User, Bookmark, Mail } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, dbUser, isLoading, logout } = useAuth()

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center gap-6">
          {/* Brand */}
          <Link
            href={user ? '/dashboard' : '/'}
            className="font-bold text-xl sm:text-2xl flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            style={{ color: '#5f462d' }}
          >
            <Bookmark className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">Bookmarks</span>
          </Link>

          {/* Search Bar - Center on desktop */}
          {!isAuthPage && (
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <ProfileSearch />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 items-center flex-shrink-0">
            {isLoading ? (
              <div
                className="w-10 h-10 rounded-full animate-pulse"
                style={{ background: 'rgba(95, 70, 45, 0.2)' }}
              ></div>
            ) : user && dbUser ? (
              <>
                {/* Inbox Icon Button */}
                <div className="relative">
                  <InboxButton userId={dbUser.id} />
                </div>

                {!isDemoPage && (
                  <Link
                    href="/dashboard"
                    className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all hover:bg-white/50"
                    style={{ color: '#5f462d' }}
                    title="Dashboard"
                  >
                    <Bookmark className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all hover:bg-white/50"
                  style={{ color: '#5f462d' }}
                  title="Profile"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:inline">Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md"
                  style={{ background: '#5f462d' }}
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                {!isAuthPage && (
                  <>
                    <Link
                      href="/auth/login"
                      className="px-4 py-2 rounded-lg font-medium transition-all hover:bg-white/50"
                      style={{ color: '#5f462d' }}
                    >
                      <span className="hidden sm:inline">Sign In</span>
                      <span className="sm:hidden">Login</span>
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md"
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
