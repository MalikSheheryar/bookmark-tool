'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser, dbUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found')
      setLoading(false)
      return
    }

    const verifyAndRefresh = async () => {
      console.log('\n🎯 ═══════ STARTING SUBSCRIPTION VERIFICATION ═══════')
      console.log('⏰ Time:', new Date().toISOString())
      console.log('🆔 Session ID:', sessionId)

      try {
        let currentAttempt = 0
        const maxAttempts = 10
        let subscriptionVerified = false

        while (currentAttempt < maxAttempts && !subscriptionVerified) {
          currentAttempt++
          setAttempts(currentAttempt)

          const waitTime = currentAttempt === 1 ? 3000 : 4000

          console.log(
            `\n⏳ Attempt ${currentAttempt}/${maxAttempts} (waiting ${waitTime}ms)...`,
          )

          await new Promise((resolve) => setTimeout(resolve, waitTime))

          // Method 1: Check via API
          try {
            console.log('📡 Calling verification API...')
            const apiResponse = await fetch('/api/subscription/verify')

            if (apiResponse.ok) {
              const apiData = await apiResponse.json()

              console.log('📊 API Response:', {
                isPremium: apiData.isPremium,
                tier: apiData.tier,
                status: apiData.status,
                hasCustomer: apiData.hasStripeCustomer,
                hasSubscription: apiData.hasStripeSubscription,
              })

              if (apiData.isPremium) {
                console.log('✅ VERIFICATION SUCCESS via API!')
                subscriptionVerified = true

                // Refresh auth context
                if (refreshUser) {
                  console.log('🔄 Refreshing auth context...')
                  await refreshUser()
                }
                break
              } else {
                console.log('⏳ Not premium yet via API')
              }
            } else {
              console.log('⚠️ API call failed:', apiResponse.status)
            }
          } catch (apiError) {
            console.error('❌ API call error:', apiError)
          }

          // Method 2: Refresh auth context and check
          if (!subscriptionVerified && refreshUser) {
            console.log('🔄 Refreshing via auth provider...')
            await refreshUser()

            // Small delay to let state update
            await new Promise((resolve) => setTimeout(resolve, 500))
          }

          // Method 3: Double-check with another API call every 3 attempts
          if (currentAttempt % 3 === 0 && !subscriptionVerified) {
            console.log('🔁 Double-checking with API...')
            try {
              const recheckResponse = await fetch('/api/subscription/verify')
              if (recheckResponse.ok) {
                const recheckData = await recheckResponse.json()
                if (recheckData.isPremium) {
                  console.log('✅ VERIFICATION SUCCESS on recheck!')
                  subscriptionVerified = true
                  if (refreshUser) {
                    await refreshUser()
                  }
                }
              }
            } catch (err) {
              console.error('⚠️ Recheck failed:', err)
            }
          }
        }

        if (!subscriptionVerified) {
          console.error(
            '❌ Subscription not verified after',
            maxAttempts,
            'attempts',
          )
          console.log('💡 Webhook might still be processing...')
          setError(
            'Subscription is taking longer than expected to activate. Please wait a moment and refresh this page, or check your subscription page.',
          )
        } else {
          console.log('🎉 SUBSCRIPTION FULLY VERIFIED!')
        }

        setVerified(subscriptionVerified)
        setLoading(false)

        console.log('════════════════════════════════════════════\n')
      } catch (err) {
        console.error('❌ Verification process error:', err)
        setError(
          'Failed to verify subscription. Please refresh the page or check your subscription page.',
        )
        setLoading(false)
      }
    }

    verifyAndRefresh()
  }, [sessionId, refreshUser])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-20"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="text-center">
          <Loader2
            className="w-16 h-16 animate-spin mx-auto mb-4"
            style={{ color: '#5f462d' }}
          />
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: '#5f462d' }}
          >
            Activating your premium subscription...
          </p>
          <p className="text-sm text-gray-600 mb-2">
            This may take up to 30 seconds
          </p>
          <p className="text-xs text-gray-500">Attempt {attempts} of 10</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 py-20"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-yellow-500 mb-4 text-5xl">⚠️</div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#5f462d' }}>
            Verification Taking Longer
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 rounded-lg font-semibold text-white"
              style={{ background: '#5f462d' }}
            >
              Refresh Page
            </button>
            <Link
              href="/subscription"
              className="block w-full px-6 py-3 rounded-lg font-semibold border-2"
              style={{ borderColor: '#5f462d', color: '#5f462d' }}
            >
              Go to Subscription Page
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-20"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-bounce" />

        <h1 className="text-3xl font-bold mb-4" style={{ color: '#5f462d' }}>
          Welcome to Premium! 🎉
        </h1>

        <p className="text-gray-600 mb-8">
          Your subscription is now active! You have full access to all premium
          features including unlimited bookmarks and the complete emoji library.
        </p>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-green-800 mb-2">
            ✅ Premium Features Unlocked:
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Unlimited bookmarks</li>
            <li>• 750+ premium emojis</li>
            <li>• Unlimited private categories</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
            style={{ background: '#5f462d' }}
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/subscription"
            className="w-full inline-block px-6 py-3 rounded-lg font-semibold border-2 transition-all hover:scale-105"
            style={{ borderColor: '#5f462d', color: '#5f462d' }}
          >
            Manage Subscription
          </Link>
        </div>
      </div>
    </div>
  )
}