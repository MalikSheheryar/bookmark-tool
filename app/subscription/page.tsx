'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  Loader2,
  X,
  Settings,
  Star,
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

// ✅ Separate component that uses useSearchParams
function SubscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, dbUser, isLoading: authLoading, refreshUser } = useAuth()

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userSubscription, setUserSubscription] = useState<any>(null)

  const canceled = searchParams.get('canceled')

  // ✅ ONLY refresh if user exists - don't redirect if no user
  useEffect(() => {
    if (!user) return // Just return, don't redirect

    const refreshOnMount = async () => {
      console.log('\n🔄 ═══════ SUBSCRIPTION PAGE REFRESH ═══════')
      if (refreshUser) {
        console.log('🔄 Calling refreshUser...')
        await refreshUser()
      }
      try {
        console.log('📡 Calling verification API...')
        const response = await fetch('/api/subscription/verify')
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Subscription status:', {
            isPremium: data.isPremium,
            tier: data.tier,
            status: data.status,
          })
        }
      } catch (error) {
        console.error('⚠️ API verification failed:', error)
      }
      console.log('════════════════════════════════════════════\n')
    }

    refreshOnMount()
    const interval = setInterval(refreshOnMount, 5000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      console.log('⏹️ Stopped auto-refresh')
    }, 60000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [user, refreshUser])

  useEffect(() => {
    if (canceled === 'true') {
      setError('Payment was canceled. No charges were made.')
      setTimeout(() => setError(null), 5000)
    }
  }, [canceled])

  useEffect(() => {
    if (dbUser) {
      console.log('👤 Current user subscription:', {
        tier: dbUser.subscription_tier,
        status: dbUser.subscription_status,
      })
      setUserSubscription({
        tier: dbUser.subscription_tier || 'free',
        status: dbUser.subscription_status || 'inactive',
      })
    } else if (!authLoading && !user) {
      // Set free tier for non-logged-in users
      setUserSubscription({
        tier: 'free',
        status: 'inactive',
      })
    }
  }, [dbUser, authLoading, user])

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    // ✅ Redirect to login if not authenticated
    if (!user) {
      router.push('/auth/login?redirect=/subscription')
      return
    }

    setLoading(planType)
    setError(null)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      console.error('Subscription error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoading('portal')
    setError(null)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }
      window.location.href = data.url
    } catch (err: any) {
      console.error('Portal error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  const isPremium =
    userSubscription?.tier === 'premium' &&
    userSubscription?.status === 'active'

  // ✅ Only show loading while auth is initially loading
  if (authLoading) {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: '#5f462d' }}
        />
      </div>
    )
  }

  // ✅ Show loading only if user exists but subscription hasn't loaded yet
  if (user && !userSubscription) {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: '#5f462d' }}
        />
      </div>
    )
  }

  // PREMIUM USER VIEW - Only show if logged in AND premium
  if (user && isPremium) {
    return (
      <div
        className="min-h-screen pt-20"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-15">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-3 rounded-full mb-6 shadow-lg border-2 border-amber-300">
              <Crown className="w-6 h-6 text-amber-600" />
              <span className="text-lg font-bold text-amber-800">
                Premium Member
              </span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: '#5f462d' }}
            >
              Manage Your Subscription
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              You're enjoying full access to all premium features!
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 md:p-12 border-2 border-green-300 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-green-800 mb-3">
                  Premium Active
                </h2>
                <p className="text-green-700 mb-6 text-lg">
                  You have unlimited access to all premium features, including
                  unlimited links, 750+ premium emojis, and unlimited private
                  categories.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium">Unlimited Links</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium">750+ Premium Emojis</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium">Unlimited Categories</span>
                  </div>
                </div>
                <button
                  onClick={handleManageSubscription}
                  disabled={loading === 'portal'}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {loading === 'portal' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading Portal...
                    </>
                  ) : (
                    <>
                      <Settings className="w-5 h-5" />
                      Manage Subscription
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#5f462d' }}>
              What You Can Do
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="font-semibold">Update Payment Method</p>
                  <p className="text-sm text-gray-600">
                    Change your card or payment details
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="font-semibold">Change Plan</p>
                  <p className="text-sm text-gray-600">
                    Switch between monthly and yearly
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="font-semibold">Cancel Anytime</p>
                  <p className="text-sm text-gray-600">
                    No commitments, cancel whenever you like
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // FREE USER / NOT LOGGED IN - Show pricing plans
  return (
    <div
      className="min-h-screen pt-20"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-15">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-sm">
            <Crown className="w-4 h-4" style={{ color: '#5f462d' }} />
            <span className="text-sm font-medium" style={{ color: '#5f462d' }}>
              Unlock Premium Features
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: '#5f462d' }}
          >
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upgrade to Premium and unlock unlimited links, exclusive emojis, and
            more!
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <Sparkles
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: '#5f462d' }}
              />
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: '#5f462d' }}
              >
                Free
              </h3>
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: '#5f462d' }}
              >
                £0
              </div>
              <p className="text-gray-600 mb-2">Forever free</p>
              <p className="text-sm text-gray-500">
                Try it instantly with no account required.
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Up to 50 links</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Basic emoji set for categories
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">1 private category</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Cloud sync</span>
              </li>
            </ul>
            <button
              disabled
              className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
            >
              {user ? 'Current Plan' : 'Always Free'}
            </button>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl p-8 border-2 border-amber-300 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              POPULAR
            </div>
            <div className="text-center mb-6">
              <Zap className="w-12 h-12 mx-auto mb-4 text-amber-600" />
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: '#5f462d' }}
              >
                Premium Monthly
              </h3>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span
                  className="text-4xl font-bold"
                  style={{ color: '#5f462d' }}
                >
                  £3.99
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-gray-600 mb-2">Billed monthly</p>
              <p className="text-sm text-gray-600">
                Everything you need to organise and share links without limits.
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  Unlimited links
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  750+ premium emojis
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  Unlimited private categories
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  Priority support
                </span>
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading === 'monthly'}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: loading === 'monthly' ? '#8b6f47' : '#5f462d',
              }}
            >
              {loading === 'monthly' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Subscribe Monthly
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-xl p-8 border-2 border-purple-300 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              BEST VALUE — SAVE 18%
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Crown className="w-12 h-12 mb-4 text-purple-600" />
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ color: '#5f462d' }}
                >
                  Premium Yearly
                </h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: '#5f462d' }}
                  >
                    £39
                  </span>
                  <span className="text-gray-600">/year</span>
                </div>
                <p className="text-gray-600 mb-4">That's only £3.25/month!</p>
                <p className="text-sm text-purple-700 font-medium bg-purple-100 inline-block px-3 py-1 rounded-full">
                  Save £8.88 compared to monthly
                </p>
              </div>
              <div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">
                      Everything in Premium Monthly
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">
                      18% discount
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">
                      Annual billing convenience
                    </span>
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('yearly')}
                  disabled={loading === 'yearly'}
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: loading === 'yearly' ? '#8b6f47' : '#5f462d',
                  }}
                >
                  {loading === 'yearly' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Subscribe Yearly
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Trusted by bookmark enthusiasts worldwide
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">🔒</span>
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">⚡</span>
              <span className="text-sm font-medium">Instant Access</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">✓</span>
              <span className="text-sm font-medium">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ✅ Main component with Suspense boundary
export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen pt-20 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
          }}
        >
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: '#5f462d' }}
          />
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  )
}
