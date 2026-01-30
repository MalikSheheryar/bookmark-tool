'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn, signInWithGoogle } from '@/lib/auth'
import { ArrowLeft, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setSuccessMessage('Account created! Please sign in.')
    }
    if (searchParams.get('reset') === 'success') {
      setSuccessMessage(
        'Password reset successful! Please sign in with your new password.'
      )
    }
    if (searchParams.get('error') === 'auth_failed') {
      setSubmitError('Authentication failed. Please try again.')
    }
    if (searchParams.get('error') === 'no_session') {
      setSubmitError('No session found. Please try again.')
    }
    if (searchParams.get('error') === 'unexpected') {
      setSubmitError('An unexpected error occurred. Please try again.')
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!validateForm()) return

    setLoading(true)
    try {
      await signIn(formData.email, formData.password)
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setSubmitError('')
    setGoogleLoading(true)
    
    try {
      await signInWithGoogle()
      // The redirect will be handled by Supabase
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setSubmitError(error.message || 'Failed to sign in with Google')
      setGoogleLoading(false)
    }
  }

  return (
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

      <div className="w-full max-w-md mt-20 bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold" style={{ color: '#5f462d' }}>
            Sign In
          </h1>
          <p className="text-gray-600 mt-2 text-sm">Access your links</p>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {submitError}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
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
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm hover:underline"
              style={{ color: '#5f462d' }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2 px-4 rounded font-semibold text-white transition-all duration-200 disabled:opacity-50"
            style={{ background: loading ? '#8b6f47' : '#5f462d' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-semibold hover:underline"
              style={{ color: '#5f462d' }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}