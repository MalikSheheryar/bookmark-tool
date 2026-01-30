// File: app/shared/[shareId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ExternalLink,
  User,
  Calendar,
  Lock,
  Globe,
  Bookmark,
  AlertCircle,
} from 'lucide-react'
import {
  getSharedCategoryData,
  type SharedCategoryData,
} from '@/lib/shared-category-service'

export default function SharedCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const shareId = params.shareId as string

  const [data, setData] = useState<SharedCategoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      console.log('═══════════════════════════════════════════════════════')
      console.log('🚀 [SharedCategoryPage] Component mounting')
      console.log('═══════════════════════════════════════════════════════')

      try {
        setLoading(true)
        setError(null)

        console.log('📋 Share ID from URL params:', shareId)
        console.log('📏 Share ID length:', shareId?.length)
        console.log('🌐 Current URL:', window.location.href)

        if (!shareId) {
          console.error('❌ No shareId provided in URL params')
          setError('Invalid share link - no token provided')
          setDebugInfo('Error: No share token in URL')
          return
        }

        console.log('📞 Calling getSharedCategoryData...')
        const startTime = performance.now()

        const result = await getSharedCategoryData(shareId)

        const endTime = performance.now()
        console.log(
          `⏱️  Fetch completed in ${(endTime - startTime).toFixed(2)}ms`,
        )

        console.log('📦 Result from getSharedCategoryData:')
        console.log('   ✓ Has result:', !!result)

        if (result) {
          console.log('   ✓ Category Name:', result.category_name)
          console.log('   ✓ Sender:', result.sender_username)
          console.log('   ✓ Bookmarks:', result.bookmarks?.length || 0)
          console.log('   ✓ Note:', result.note ? 'Yes' : 'No')
          console.log('   📄 Full result:', JSON.stringify(result, null, 2))

          setData(result)
          setDebugInfo(
            `Success! Category: ${result.category_name}, Sender: ${result.sender_username}`,
          )

          console.log('✅ [SharedCategoryPage] Data set successfully')
        } else {
          console.error('❌ [SharedCategoryPage] No data returned')
          console.error('   Share Token:', shareId)
          console.error('   This could mean:')
          console.error('   1. Token does not exist in database')
          console.error('   2. Token has been deleted')
          console.error('   3. Database query failed')

          setError('Shared category not found or has expired')
          setDebugInfo(`Error: No data for token ${shareId}`)
        }
      } catch (err) {
        console.error('💥 [SharedCategoryPage] Fatal error:')
        console.error('   Error Type:', err?.constructor?.name)
        console.error(
          '   Error Message:',
          err instanceof Error ? err.message : String(err),
        )
        console.error('   Stack:', err instanceof Error ? err.stack : 'N/A')

        setError('Failed to load shared category')
        setDebugInfo(
          `Exception: ${err instanceof Error ? err.message : String(err)}`,
        )
      } finally {
        setLoading(false)
        console.log('🏁 [SharedCategoryPage] Fetch operation complete')
        console.log('═══════════════════════════════════════════════════════')
      }
    }

    if (shareId) {
      fetchData()
    } else {
      console.error('❌ No shareId available, skipping fetch')
      setLoading(false)
      setError('Invalid share link')
    }
  }, [shareId])

  const getInitials = () => {
    if (!data) return 'U'
    const name = data.sender_full_name || data.sender_username
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Loading State
  if (loading) {
    console.log('🔄 [Render] Showing loading state')
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#5f462d' }}
          />
          <p style={{ color: '#5f462d' }}>Loading shared category...</p>
          <p className="text-xs text-gray-500 mt-2">Token: {shareId}</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error || !data) {
    console.log('❌ [Render] Showing error state')
    console.log('   Error:', error)
    console.log('   Has Data:', !!data)
    console.log('   Debug Info:', debugInfo)

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: '#5f462d' }}
            >
              Category Not Available
            </h1>
            <p className="text-gray-600 mb-4">
              {error ||
                'This shared category is not available or may have been deleted'}
            </p>

            {/* Debug Info Box
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-left">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Debug Information:
                  </p>
                  <p className="text-xs text-red-700 font-mono break-all">
                    Token: {shareId}
                  </p>
                  <p className="text-xs text-red-700 mt-1">{debugInfo}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Check browser console (F12) for detailed logs
                  </p>
                </div>
              </div>
            </div> */}

            <div className="space-y-2">
              <Link
                href="/"
                className="block px-6 py-3 rounded-lg text-white transition-colors"
                style={{ background: '#5f462d' }}
              >
                Go to Home
              </Link>
              <button
                onClick={() => router.back()}
                className="block w-full px-6 py-3 rounded-lg bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success State - Show Category
  console.log('✅ [Render] Showing success state with data')
  console.log('   Category:', data.category_name)
  console.log('   Bookmarks:', data.bookmarks?.length || 0)

  return (
    <div
      className="min-h-screen py-8"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: '#5f462d' }} />
          </button>
          <h1 className="text-2xl font-bold" style={{ color: '#5f462d' }}>
            Shared Category
          </h1>
        </div>

        {/* Debug Info (only in development)
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-xs">
            <p className="font-semibold text-blue-800">Debug Info:</p>
            <p className="text-blue-700">Token: {shareId}</p>
            <p className="text-blue-700">Category: {data.category_name}</p>
            <p className="text-blue-700">Sender: {data.sender_username}</p>
            <p className="text-blue-700">
              Bookmarks: {data.bookmarks?.length || 0}
            </p>
          </div>
        )} */}

        {/* Sender Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {data.sender_profile_picture ? (
              <img
                src={data.sender_profile_picture}
                alt={data.sender_username}
                className="w-16 h-16 rounded-full object-cover border-2"
                style={{ borderColor: '#5f462d' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold border-2"
                style={{ background: '#5f462d', borderColor: '#5f462d' }}
              >
                {getInitials()}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-500">Shared by</p>
              <p className="text-lg font-bold text-gray-900">
                {data.sender_full_name || data.sender_username}
              </p>
              <p className="text-sm text-gray-600">@{data.sender_username}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                {formatDate(data.created_at)}
              </div>
              <div className="flex items-center gap-2">
                {data.is_public_category ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    <Globe className="w-3 h-3" />
                    Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    <Lock className="w-3 h-3" />
                    Private Share
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Note */}
          {data.note && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-gray-700 italic">"{data.note}"</p>
            </div>
          )}
        </div>

        {/* Category Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">{data.category_emoji || '📁'}</span>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#5f462d' }}>
                {data.category_name}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Bookmark className="w-4 h-4" />
                {data.bookmarks?.length || 0} Link
                {(data.bookmarks?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Bookmarks */}
          {!data.bookmarks || data.bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Links Yet
              </h3>
              <p className="text-gray-500">
                This category doesn't have any Links yet
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.bookmarks.map((bookmark, index) => (
                <a
                  key={index}
                  href={bookmark.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-4 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all hover:border-[#5f462d]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate group-hover:text-[#5f462d] transition-colors">
                        {bookmark.site_name}
                      </h4>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {bookmark.site_url}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#5f462d] transition-colors flex-shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 mb-4">
            Like what you see? Create and organise your own link
            collections.{' '}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-all hover:shadow-lg"
            style={{ background: '#5f462d' }}
          >
            Continue →
          </Link>
        </div>
      </div>
    </div>
  )
}
