'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth'
import { ArrowLeft, Mail, Lock } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      console.log('📧 Sending password reset email to:', email)
      await resetPassword(email)
      console.log('✅ Reset email sent successfully')
      setMessage(
        'Password reset link sent! Please check your email (including spam folder).'
      )
      setEmail('')
    } catch (error: any) {
      console.error('❌ Reset password error:', error)
      setError(error.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
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

      <div className="w-full mt-20 max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <div className="mb-8 text-center">
          <div
            className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: '#f5f5dc' }}
          >
            <Lock className="w-6 h-6" style={{ color: '#5f462d' }} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#5f462d' }}>
            Reset Password
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Enter your email to receive a reset link
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
              Email
            </label>
            <div className="relative flex items-center">
              <Mail
                className="absolute left-3 w-4 h-4 pointer-events-none"
                style={{ color: '#5f462d' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded focus:border-transparent focus:outline-none focus:ring-2"
                placeholder="you@example.com"
                style={{ '--tw-ring-color': '#5f462d' } as any}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: loading ? '#8b6f47' : '#5f462d' }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
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
