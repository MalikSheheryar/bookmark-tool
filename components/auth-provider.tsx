'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react'
import { createClient } from '@/lib/supabase-client'
import { usePathname, useRouter } from 'next/navigation'

interface AuthContextType {
  user: any | null
  dbUser: any | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [dbUser, setDbUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const isPasswordRecoveryRef = useRef(false)

  const ensureUserInDatabase = async (authUser: any) => {
    console.log('🔍 ensureUserInDatabase: Starting for user:', authUser?.id)

    if (!authUser) {
      console.log('❌ ensureUserInDatabase: No authUser provided')
      return null
    }

    try {
      console.log('🔍 ensureUserInDatabase: Creating supabase client...')
      const supabase = createClient()

      console.log(
        '🔍 ensureUserInDatabase: Querying database for auth_id:',
        authUser.id
      )

      // Add timeout to prevent hanging
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )

      const { data: existingUser, error: queryError } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as any

      if (queryError) {
        console.error('❌ ensureUserInDatabase: Query error:', queryError)
        return null
      }

      if (existingUser) {
        console.log(
          '✅ ensureUserInDatabase: User exists in DB:',
          existingUser.id
        )
        return existingUser
      }

      console.log(
        '🔧 ensureUserInDatabase: User not found, creating new user...'
      )
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.id,
          email: authUser.email,
          username: authUser.email?.split('@')[0] || null,
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            null,
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ ensureUserInDatabase: Insert error:', insertError)
        return null
      }

      console.log('✅ ensureUserInDatabase: User created in DB:', newUser.id)
      return newUser
    } catch (error) {
      console.error('❌ ensureUserInDatabase: Unexpected error:', error)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true

    console.log('🎬 AuthProvider: Effect running for path:', pathname)

    // Skip on callback page
    if (pathname === '/auth/callback') {
      console.log('🚫 AuthProvider: On callback page - standing down')
      setIsLoading(false)
      return
    }

    // Check for password recovery
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const isOnResetPage = pathname === '/auth/reset-password'
      const hasRecoveryToken =
        hash.includes('access_token') && hash.includes('type=recovery')

      if (isOnResetPage || hasRecoveryToken) {
        console.log('🔐 AuthProvider: Recovery mode active')
        isPasswordRecoveryRef.current = true
        if (!isOnResetPage) {
          router.replace('/auth/reset-password')
        }
        setIsLoading(false)
        return
      } else if (isPasswordRecoveryRef.current) {
        console.log('🔓 AuthProvider: Exiting recovery mode')
        isPasswordRecoveryRef.current = false
      }
    }

    const supabase = createClient()

    // Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (pathname === '/auth/callback') return

      console.log(
        '🔄 AuthProvider: Auth state changed:',
        event,
        'User:',
        session?.user?.id
      )

      if (!isMounted) return

      // Password recovery
      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && pathname === '/auth/reset-password')
      ) {
        console.log('🔐 AuthProvider: Password recovery detected')
        isPasswordRecoveryRef.current = true
        setUser(null)
        setDbUser(null)
        setIsLoading(false)
        if (pathname !== '/auth/reset-password') {
          router.replace('/auth/reset-password')
        }
        return
      }

      // Sign out
      if (event === 'SIGNED_OUT') {
        console.log('🚪 AuthProvider: User signed out')
        isPasswordRecoveryRef.current = false
        setUser(null)
        setDbUser(null)
        setIsLoading(false)
        return
      }

      // Sign in / session update
      if (!isPasswordRecoveryRef.current) {
        const newUser = session?.user || null
        console.log('👤 AuthProvider: Setting user:', newUser?.id || 'none')
        setUser(newUser)

        // CRITICAL: Set loading to false IMMEDIATELY
        console.log('🏁 AuthProvider: Setting isLoading to FALSE (immediate)')
        setIsLoading(false)

        // Then try to get DB user in background
        if (newUser) {
          console.log('🔧 AuthProvider: Fetching DB user in background...')
          ensureUserInDatabase(newUser)
            .then((dbUserData) => {
              console.log(
                '✅ AuthProvider: DB user result:',
                dbUserData?.id || 'null'
              )
              if (isMounted) {
                setDbUser(dbUserData)
              }
            })
            .catch((error) => {
              console.error('❌ AuthProvider: DB user error:', error)
              if (isMounted) {
                setDbUser(null)
              }
            })
        } else {
          setDbUser(null)
        }
      }
    })

    // Initial session check
    console.log('🔍 AuthProvider: Checking initial session...')
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return

        console.log('📊 AuthProvider: Initial session:', {
          hasSession: !!session,
          userId: session?.user?.id,
        })

        if (isPasswordRecoveryRef.current) {
          setUser(null)
          setDbUser(null)
          setIsLoading(false)
          return
        }

        const authUser = session?.user || null
        setUser(authUser)

        // CRITICAL: Set loading to false IMMEDIATELY
        console.log('🏁 AuthProvider: Setting isLoading to FALSE (initial)')
        setIsLoading(false)

        if (authUser) {
          console.log(
            '👤 AuthProvider: Initial user found, fetching DB user in background...'
          )
          ensureUserInDatabase(authUser)
            .then((dbUserData) => {
              console.log(
                '✅ AuthProvider: Initial DB user:',
                dbUserData?.id || 'null'
              )
              if (isMounted) {
                setDbUser(dbUserData)
              }
            })
            .catch((error) => {
              console.error('❌ AuthProvider: Initial DB user error:', error)
              if (isMounted) {
                setDbUser(null)
              }
            })
        } else {
          console.log('❌ AuthProvider: No initial session')
          setDbUser(null)
        }
      })
      .catch((error) => {
        console.error('❌ AuthProvider: getSession error:', error)
        setUser(null)
        setDbUser(null)
        setIsLoading(false)
      })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  const logout = async () => {
    try {
      console.log('🚪 AuthProvider: Logging out user:', user?.id)
      const supabase = createClient()
      await supabase.auth.signOut()
      isPasswordRecoveryRef.current = false
      setUser(null)
      setDbUser(null)
      console.log('✅ AuthProvider: Logout successful')
    } catch (error) {
      console.error('❌ AuthProvider: Logout error:', error)
    }
  }

  const refetchUser = async () => {
    if (!isPasswordRecoveryRef.current && pathname !== '/auth/callback') {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        const dbUserData = await ensureUserInDatabase(session.user)
        setDbUser(dbUserData)
      }
    }
  }

  const value: AuthContextType = {
    user,
    dbUser,
    isLoading,
    isAuthenticated: !!user && !isPasswordRecoveryRef.current,
    logout,
    refetchUser,
  }

  console.log('📤 AuthProvider: Context:', {
    hasUser: !!user,
    userId: user?.id,
    hasDbUser: !!dbUser,
    dbUserId: dbUser?.id,
    isLoading,
    isAuthenticated: value.isAuthenticated,
  })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
