// File: app/u/[username]/page.tsx (UPDATED with Reactions)
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Instagram,
  Twitter,
  Calendar,
  Bookmark,
  User,
  Share2,
  Check,
} from 'lucide-react'
import {
  getPublicProfile,
  getPublicCategoryBookmarks,
  type PublicProfile,
  type PublicBookmark,
} from '@/lib/public-profile-service'
import {
  getCategoryReactions,
  toggleCategoryReaction,
  subscribeToCategoryReactions,
  type Reaction,
} from '@/lib/reactions-service'
import { ReactionPicker } from '@/components/reaction-picker'
import { ReactionDisplay } from '@/components/reaction-display'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { dbUser } = useAuth()
  const username = params.username as string

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<PublicBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // ✅ NEW: Reactions state
  const [categoryReactions, setCategoryReactions] = useState<
    Record<string, Reaction[]>
  >({})
  const [reactionChannels, setReactionChannels] = useState<
    Record<string, RealtimeChannel>
  >({})

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await getPublicProfile(username)

        if (!data) {
          setError('Profile not found')
          return
        }

        setProfile(data)

        // Auto-select first category
        if (data.public_categories && data.public_categories.length > 0) {
          setSelectedCategory(data.public_categories[0].name)
        }

        // ✅ NEW: Fetch reactions for all public categories
        if (data.public_categories && data.public_categories.length > 0) {
          fetchAllCategoryReactions(data.public_categories.map((c) => c.id))
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username])

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!selectedCategory || !username) return

      try {
        setLoadingBookmarks(true)
        const data = await getPublicCategoryBookmarks(
          username,
          selectedCategory,
        )
        setBookmarks(data)
      } catch (err) {
        console.error('Error fetching bookmarks:', err)
        setBookmarks([])
      } finally {
        setLoadingBookmarks(false)
      }
    }

    fetchBookmarks()
  }, [selectedCategory, username])

  // ✅ NEW: Fetch reactions for all categories
  const fetchAllCategoryReactions = async (categoryIds: string[]) => {
    const reactionsMap: Record<string, Reaction[]> = {}

    for (const categoryId of categoryIds) {
      const reactions = await getCategoryReactions(categoryId, dbUser?.id)
      reactionsMap[categoryId] = reactions
    }

    setCategoryReactions(reactionsMap)
  }

  // ✅ NEW: Setup realtime for category reactions
  const setupCategoryReactionRealtime = (categoryId: string) => {
    if (reactionChannels[categoryId]) return // Already subscribed

    const channel = subscribeToCategoryReactions(categoryId, async () => {
      const reactions = await getCategoryReactions(categoryId, dbUser?.id)
      setCategoryReactions((prev) => ({
        ...prev,
        [categoryId]: reactions,
      }))
    })

    setReactionChannels((prev) => ({
      ...prev,
      [categoryId]: channel,
    }))
  }

  // ✅ NEW: Handle category reaction toggle
  const handleCategoryReactionToggle = async (
    categoryId: string,
    emoji: string,
  ) => {
    if (!dbUser?.id) {
      alert('Please log in to react')
      return
    }

    try {
      await toggleCategoryReaction(categoryId, dbUser.id, emoji)

      // Immediately refetch reactions for this category
      const reactions = await getCategoryReactions(categoryId, dbUser.id)
      setCategoryReactions((prev) => ({
        ...prev,
        [categoryId]: reactions,
      }))
    } catch (error) {
      console.error('❌ Error toggling category reaction:', error)
      alert('Failed to add reaction. Please try again.')
    }
  }

  // ✅ NEW: Setup realtime for visible categories
  useEffect(() => {
    if (!profile?.public_categories) return

    profile.public_categories.forEach((category) => {
      setupCategoryReactionRealtime(category.id)
    })

    // Cleanup
    return () => {
      Object.values(reactionChannels).forEach((channel) => {
        channel.unsubscribe()
      })
    }
  }, [profile?.public_categories])

  const handleShare = async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name || profile?.username}'s Profile`,
          text: `Check out ${
            profile?.full_name || profile?.username
          }'s bookmarks`,
          url: url,
        })
      } catch (err) {
        console.log('Share canceled or failed')
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getInitials = () => {
    const name = profile?.full_name || profile?.username || 'U'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (loading) {
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
          <p style={{ color: '#5f462d' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
        }}
      >
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#5f462d' }}>
            Profile Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "This profile doesn't exist or isn't public yet."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors"
            style={{ background: '#5f462d' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      <div className="container mx-auto mt-20 px-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors"
            style={{
              borderColor: '#5f462d',
              color: '#5f462d',
              background: copied ? '#5f462d' : 'white',
            }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share Profile
              </>
            )}
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.full_name || profile.username}
                  className="w-32 h-32 rounded-full object-cover border-4"
                  style={{ borderColor: '#5f462d' }}
                />
              ) : (
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4"
                  style={{ background: '#5f462d', borderColor: '#5f462d' }}
                >
                  {getInitials()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  @{profile.username}
                </span>
              </div>
              <h1
                className="text-3xl font-bold mb-3"
                style={{ color: '#5f462d' }}
              >
                {profile.full_name || profile.username}
              </h1>
              {profile.bio && (
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap gap-3 mb-4">
                {profile.instagram_url && (
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Instagram
                      className="w-4 h-4"
                      style={{ color: '#E1306C' }}
                    />
                    <span className="text-xs font-medium">Instagram</span>
                  </a>
                )}
                {profile.twitter_url && (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Twitter className="w-4 h-4" style={{ color: '#1DA1F2' }} />
                    <span className="text-xs font-medium">Twitter</span>
                  </a>
                )}
                {profile.other_link && (
                  <a
                    href={profile.other_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Globe className="w-4 h-4" style={{ color: '#5f462d' }} />
                    <span className="text-xs font-medium">Website</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Joined{' '}
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Categories & Bookmarks */}
        {profile.public_categories && profile.public_categories.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2
                  className="text-xl font-bold mb-4"
                  style={{ color: '#5f462d' }}
                >
                  Public Categories
                </h2>
                <div className="space-y-2">
                  {profile.public_categories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory(category.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                          selectedCategory === category.name
                            ? 'shadow-md'
                            : 'hover:bg-gray-50'
                        }`}
                        style={{
                          background:
                            selectedCategory === category.name
                              ? '#5f462d'
                              : 'transparent',
                          color:
                            selectedCategory === category.name
                              ? 'white'
                              : '#333',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {category.emoji || '📁'}
                          </span>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span
                          className="text-sm px-2 py-1 rounded-full"
                          style={{
                            background:
                              selectedCategory === category.name
                                ? 'rgba(255,255,255,0.2)'
                                : 'rgba(95,70,45,0.1)',
                          }}
                        >
                          {category.bookmark_count}
                        </span>
                      </button>

                      {/* ✅ NEW: Reactions for category */}
                      <div className="px-3 py-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ReactionPicker
                            onSelect={(emoji) =>
                              handleCategoryReactionToggle(category.id, emoji)
                            }
                            disabled={!dbUser}
                            className="flex-shrink-0"
                          />
                          {!dbUser && (
                            <span className="text-xs text-gray-500">
                              Login to react
                            </span>
                          )}
                        </div>

                        {categoryReactions[category.id] &&
                          categoryReactions[category.id].length > 0 && (
                            <ReactionDisplay
                              reactions={categoryReactions[category.id]}
                              onReactionClick={(emoji) =>
                                handleCategoryReactionToggle(category.id, emoji)
                              }
                              maxDisplay={3}
                            />
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bookmarks Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: '#5f462d' }}
                  >
                    {selectedCategory}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Bookmark className="w-4 h-4" />
                    {bookmarks.length} bookmark
                    {bookmarks.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {loadingBookmarks ? (
                  <div className="text-center py-12">
                    <div
                      className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                      style={{ borderColor: '#5f462d' }}
                    />
                    <p className="text-gray-500">Loading bookmarks...</p>
                  </div>
                ) : bookmarks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📚</div>
                    <p className="text-gray-600">
                      No Links in this category yet
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {bookmarks.map((bookmark, index) => (
                      <a
                        key={index}
                        href={bookmark.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all"
                        style={{
                          borderColor: '#e2e8f0',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#5f462d'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0'
                        }}
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
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: '#5f462d' }}
            >
              No Public Categories
            </h3>
            <p className="text-gray-600">
              This user hasn't made any categories public yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
