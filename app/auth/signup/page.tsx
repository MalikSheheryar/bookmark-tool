// ============================================================================
// FILE: app/auth/signup/page.tsx
// ============================================================================

'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { signUp, signInWithGoogle } from '@/lib/auth'
import { ArrowLeft, Mail, Lock, User, CheckCircle } from 'lucide-react'
import { PolicyDisclaimerModal } from '@/components/PolicyDisclaimerModal'
import { usePolicyAcceptance } from '@/hooks/usePolicyAcceptance'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showEmailSent, setShowEmailSent] = useState(false)

  // Policy acceptance hook
  const {
    showPolicyModal,
    isPolicyProcessing,
    requirePolicyAcceptance,
    handlePolicyAccept,
    handlePolicyClose,
  } = usePolicyAcceptance()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * The actual sign-up logic that runs AFTER policy acceptance
   */
  const performSignUp = async () => {
    setSubmitError('')
    setShowEmailSent(false)
    setLoading(true)

    try {
      console.log('📝 Attempting signup for:', formData.email)

      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
      })

      console.log('✅ Signup successful - email sent')

      // Show success message
      setShowEmailSent(true)
    } catch (error: any) {
      console.error('❌ Signup error:', error)
      setSubmitError(error.message || 'Failed to create account')
      throw error // Re-throw so the hook knows there was an error
    } finally {
      setLoading(false)
    }
  }

  /**
   * The actual Google OAuth logic that runs AFTER policy acceptance
   */
  const performGoogleSignUp = async () => {
    setSubmitError('')
    setGoogleLoading(true)

    try {
      await signInWithGoogle()
      // The redirect will be handled by Supabase
    } catch (error: any) {
      console.error('Google sign-up error:', error)
      setSubmitError(error.message || 'Failed to sign up with Google')
      setGoogleLoading(false)
      throw error // Re-throw so the hook knows there was an error
    }
  }

  /**
   * Called when user submits the email signup form
   * Shows policy modal first, then executes sign-up after acceptance
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setShowEmailSent(false)

    if (!validateForm()) return

    // Show policy modal and store the sign-up action
    requirePolicyAcceptance(performSignUp)
  }

  /**
   * Called when user clicks "Continue with Google" button
   * Shows policy modal first, then executes OAuth after acceptance
   */
  const handleGoogleSignUp = async () => {
    setSubmitError('')

    // Show policy modal and store the Google OAuth action
    requirePolicyAcceptance(performGoogleSignUp)
  }

  // If email sent, show success screen
  if (showEmailSent) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
          <div className="mb-6">
            <CheckCircle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: '#5f462d' }}
            />
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: '#5f462d' }}
            >
              Check Your Email
            </h1>
            <p className="text-gray-600 text-sm">
              We've sent a verification link to:
            </p>
            <p className="font-semibold mt-2" style={{ color: '#5f462d' }}>
              {formData.email}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Important:</strong> Click the verification link in your
              email to activate your account.
            </p>
            <p className="text-sm text-gray-600">
              The link expires in 1 hour. If you don't see the email, check your
              spam folder.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="inline-block py-2 px-6 rounded font-semibold text-white transition-all duration-200"
            style={{ background: '#5f462d' }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <Link
          href="/"
          className="absolute top-4 left-4 flex items-center gap-2 hover:opacity-70 transition-opacity"
          style={{ color: '#5f462d' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        <div className="w-full mt-20 max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold" style={{ color: '#5f462d' }}>
              Create Account
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              Join us to organize your links
            </p>
          </div>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {submitError}
            </div>
          )}

          {/* Google Sign Up Button */}
          <button
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full mb-4 py-2.5 px-4 border-2 border-gray-300 rounded font-semibold bg-white hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{ color: '#5f462d' }}
          >
            {googleLoading ? (
              <>
                <div
                  className="animate-spin rounded-full h-5 w-5 border-b-2"
                  style={{ borderColor: '#5f462d' }}
                ></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or sign up with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: '#5f462d' }}
              >
                Full Name
              </label>
              <div className="mt-1 relative flex items-center">
                <User
                  className="absolute left-3 w-4 h-4"
                  style={{ color: '#5f462d' }}
                />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="John Doe"
                  style={{ '--tw-ring-color': '#5f462d' } as any}
                  disabled={loading || googleLoading}
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: '#5f462d' }}
              >
                Email
              </label>
              <div className="mt-1 relative flex items-center">
                <Mail
                  className="absolute left-3 w-4 h-4"
                  style={{ color: '#5f462d' }}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="you@example.com"
                  style={{ '--tw-ring-color': '#5f462d' } as any}
                  disabled={loading || googleLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: '#5f462d' }}
              >
                Password
              </label>
              <div className="mt-1 relative flex items-center">
                <Lock
                  className="absolute left-3 w-4 h-4"
                  style={{ color: '#5f462d' }}
                />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="••••••"
                  style={{ '--tw-ring-color': '#5f462d' } as any}
                  disabled={loading || googleLoading}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: '#5f462d' }}
              >
                Confirm Password
              </label>
              <div className="mt-1 relative flex items-center">
                <Lock
                  className="absolute left-3 w-4 h-4"
                  style={{ color: '#5f462d' }}
                />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="••••••"
                  style={{ '--tw-ring-color': '#5f462d' } as any}
                  disabled={loading || googleLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2 px-4 rounded font-semibold text-white transition-all duration-200 disabled:opacity-50"
              style={{ background: loading ? '#8b6f47' : '#5f462d' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-semibold hover:underline"
                style={{ color: '#5f462d' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Policy Disclaimer Modal */}
      <PolicyDisclaimerModal
        show={showPolicyModal}
        onClose={handlePolicyClose}
        onAccept={handlePolicyAccept}
        isProcessing={isPolicyProcessing}
      />
    </>
  )
}
