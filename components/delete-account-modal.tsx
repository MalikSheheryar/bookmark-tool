// File: components/delete-account-modal.tsx
'use client'

import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'

interface DeleteAccountModalProps {
  show: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteAccountModal({
  show,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  if (!show) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error deleting account:', error)
      setIsDeleting(false)
    }
  }

  // ✅ Handle sign out without deleting
  const handleSignOutOnly = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-red-200">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Delete account</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Are you sure you want to delete your account?
          </h3>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              This will permanently remove:
            </p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Your links</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Your categories</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Your shared collections</span>
              </li>
            </ul>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <p className="text-sm text-red-800 font-semibold">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-4 space-y-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Deleting...
              </span>
            ) : (
              <>Yes, delete my account</>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="bg-gray-100 text-gray-700 py-2.5 px-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
            >
              <span className="block font-semibold text-sm">Cancel</span>
              <span className="text-xs text-gray-500 mt-0.5 block">
                Go back
              </span>
            </button>

            <button
              onClick={handleSignOutOnly}
              disabled={isDeleting}
              className="bg-white border-2 border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
            >
              <span className="block font-semibold text-sm">
                Keep & sign out
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">
                Return anytime
              </span>
            </button>
          </div>

          {isDeleting && (
            <p className="text-center text-xs text-gray-600 mt-2">
              Permanently removing your account and all associated data...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
