'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    console.log('='.repeat(60))
    console.log('🚀 CALLBACK PAGE MOUNTED')
    console.log('='.repeat(60))

    const handleCallback = async () => {
      try {
        const supabase = createClient()

        // Get URL params
        const params = new URLSearchParams(window.location.search)
        const urlCode = params.get('code')
        const error = params.get('error')
        const errorDescription = params.get('error_description')

        console.log('📦 URL Params:', {
          hasCode: !!urlCode,
          code: urlCode?.substring(0, 10) + '...',
          error: error || 'none',
          errorDescription: errorDescription || 'none',
          fullUrl: window.location.href,
        })

        // Handle errors
        if (error) {
          console.error('❌ Error in URL:', error, errorDescription)
          setStatus('Authentication failed')

          // Provide user-friendly error messages
          let errorMessage = error
          if (error === 'access_denied') {
            errorMessage = 'access_denied'
          } else if (errorDescription?.includes('expired')) {
            errorMessage = 'link_expired'
          }

          window.location.replace(`/auth/login?error=${errorMessage}`)
          return
        }

        // Wait for Supabase to process the code
        console.log('⏳ Waiting for session to be established...')
        setStatus('Verifying...')

        // Give Supabase a moment to exchange the code
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check session
        console.log('🔍 Checking for session...')
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log('📊 Session check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          emailConfirmed: session?.user?.email_confirmed_at,
          provider: session?.user?.app_metadata?.provider,
        })

        if (!session?.user) {
          console.error('❌ No session found after callback')
          setStatus('Session error')
          window.location.replace('/auth/login?error=no_session')
          return
        }

        const user = session.user
        console.log('✅ User authenticated:', user.id)
        console.log('📧 Email:', user.email)
        console.log('✉️ Email confirmed:', !!user.email_confirmed_at)

        // Create profile if needed
        setStatus('Setting up account...')
        const email = user.email || ''
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split('@')[0]

        console.log('👤 Creating/updating profile:', { email, fullName })

        try {
          const { createUserProfileClient } = await import('@/lib/user-service')
          await createUserProfileClient(user.id, email, fullName)
          console.log('✅ Profile created/updated')
        } catch (profileError) {
          console.warn('⚠️ Profile error (non-critical):', profileError)
        }

        // Success - redirect to dashboard
        console.log('🎯 SUCCESS - Redirecting to dashboard')
        setStatus('Success! Redirecting...')

        setTimeout(() => {
          console.log('🚀 REDIRECTING NOW')
          window.location.replace('/dashboard')
        }, 500)
      } catch (err) {
        console.error('❌ CRITICAL ERROR:', err)
        setStatus('An error occurred')
        window.location.replace('/auth/login?error=unexpected')
      }
    }

    handleCallback()
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            border: '4px solid transparent',
            borderTop: '4px solid #5f462d',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem',
          }}
        />
        <h2
          style={{
            color: '#5f462d',
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          {status}
        </h2>
        <p style={{ color: '#8b6f47', fontSize: '0.875rem' }}>Please wait...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
