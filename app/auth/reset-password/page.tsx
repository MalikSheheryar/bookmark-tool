'use client'

import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/lib/auth'
import { createClient } from '@/lib/supabase-client'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  const hasCheckedSession = useRef(false)

  useEffect(() => {
    const checkRecoverySession = async () => {
      // Prevent multiple checks
      if (hasCheckedSession.current) return
      hasCheckedSession.current = true

      try {
        const supabase = createClient()

        // Wait a bit for the hash to be processed by Supabase
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        console.log('🔍 Reset Password - Session check:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: sessionError?.message,
        })

        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError('Invalid or expired reset link. Please request a new one.')
          setIsValidToken(false)
          setCheckingToken(false)
          return
        }

        // Check if we have a valid recovery session
        if (session && session.user) {
          console.log(
            '✅ Valid recovery session found for user:',
            session.user.id
          )
          setIsValidToken(true)
        } else {
          console.log('❌ No valid recovery session found')
          setError('Invalid or expired reset link. Please request a new one.')
          setIsValidToken(false)
        }
      } catch (err) {
        console.error('❌ Error checking recovery session:', err)
        setError('An error occurred. Please try again.')
        setIsValidToken(false)
      } finally {
        setCheckingToken(false)
      }
    }

    checkRecoverySession()
  }, [])

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('All fields are required')
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      console.log('🔄 Updating password...')
      await updatePassword(newPassword)
      console.log('✅ Password updated successfully')

      setPasswordUpdated(true)
      setMessage('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')

      // Sign out explicitly to clear the recovery session
      const supabase = createClient()
      console.log('🔐 Signing out and clearing recovery session...')
      await supabase.auth.signOut()
      console.log('✅ Recovery session cleared')

      // Redirect immediately after signOut
      console.log('🔐 Redirecting to login page...')
      window.location.href = '/auth/login?reset=success'
    } catch (error: any) {
      console.error('❌ Password update error:', error)
      setError(error.message || 'Failed to update password. Please try again.')
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: '#5f462d' }}
          ></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="w-full mt-20 max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-600">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 mt-2 text-sm">{error}</p>
          </div>
          <Link
            href="/auth/forgot-password"
            className="block w-full py-2 px-4 rounded font-semibold text-white text-center transition-all duration-200 hover:opacity-90"
            style={{ background: '#5f462d' }}
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    )
  }

  if (passwordUpdated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              Password Updated!
            </h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. Redirecting you to
              the login page...
            </p>
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
              style={{ borderColor: '#5f462d' }}
            ></div>
          </div>
        </div>
      </div>
    )
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

      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <div className="mb-8 text-center">
          <div
            className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: '#f5f5dc' }}
          >
            <Lock className="w-6 h-6" style={{ color: '#5f462d' }} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#5f462d' }}>
            Set New Password
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Enter your new password below
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: '#5f462d' }}
            >
              New Password
            </label>
            <div className="relative flex items-center">
              <Lock
                className="absolute left-3 w-4 h-4 pointer-events-none"
                style={{ color: '#5f462d' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border-2 border-gray-200 rounded focus:border-transparent focus:outline-none focus:ring-2"
                placeholder="Enter new password"
                style={{ '--tw-ring-color': '#5f462d' } as any}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 hover:opacity-70 transition-opacity"
                style={{ color: '#5f462d' }}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Must be 8+ characters with uppercase, lowercase, and number
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: '#5f462d' }}
            >
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <Lock
                className="absolute left-3 w-4 h-4 pointer-events-none"
                style={{ color: '#5f462d' }}
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border-2 border-gray-200 rounded focus:border-transparent focus:outline-none focus:ring-2"
                placeholder="Confirm new password"
                style={{ '--tw-ring-color': '#5f462d' } as any}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 hover:opacity-70 transition-opacity"
                style={{ color: '#5f462d' }}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: loading ? '#8b6f47' : '#5f462d' }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Remember your password?{' '}
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
  )
}
