// File: components/profile-view.tsx (UPDATED - with Delete Account)
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Edit2,
  Save,
  X,
  Camera,
  Instagram,
  Twitter,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import {
  updateUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getUserProfileClient,
} from '@/lib/user-service'
import { useAuth } from '@/components/auth-provider'
import { Share2, Check, Copy, Globe } from 'lucide-react'
import {
  checkUsernameAvailable,
  generateUsername,
} from '@/lib/public-profile-service'
import { DeleteAccountModal } from '@/components/delete-account-modal'
import { deleteUserAccount } from '@/lib/account-deletion-service'

interface ProfileViewProps {
  userId: string
  userEmail?: string
}

export default function ProfileView({
  userId,
  userEmail = '',
}: ProfileViewProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ✅ NEW: Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [userProfile, setUserProfile] = useState<any>({
    full_name: '',
    bio: '',
    profile_picture_url: null,
    instagram_url: '',
    twitter_url: '',
    other_link: '',
    created_at: new Date().toISOString(),
  })

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    instagram_url: '',
    twitter_url: '',
    other_link: '',
  })

  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [shareUrlCopied, setShareUrlCopied] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  )
  const [checkingUsername, setCheckingUsername] = useState(false)

  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.username || formData.username === userProfile.username) {
        setUsernameAvailable(null)
        return
      }

      setCheckingUsername(true)
      try {
        const available = await checkUsernameAvailable(
          formData.username,
          userId,
        )
        setUsernameAvailable(available)
      } catch (error) {
        console.error('Error checking username:', error)
        setUsernameAvailable(null)
      } finally {
        setCheckingUsername(false)
      }
    }

    const timer = setTimeout(checkUsername, 500)
    return () => clearTimeout(timer)
  }, [formData.username, userProfile.username, userId])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const profile = await getUserProfileClient(userId)

        if (profile) {
          setUserProfile(profile)
          setFormData({
            full_name: profile.full_name || '',
            username: profile.username || '',
            bio: profile.bio || '',
            instagram_url: profile.instagram_url || '',
            twitter_url: profile.twitter_url || '',
            other_link: profile.other_link || '',
          })
          setProfilePicture(profile.profile_picture_url)
        } else {
          setFormData({
            full_name: '',
            username: '',
            bio: '',
            instagram_url: '',
            twitter_url: '',
            other_link: '',
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchProfile()
    }
  }, [userId])

  const handleSignOut = async () => {
    try {
      await signOut()
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out')
    }
  }

  const handleGenerateUsername = async () => {
    const generated = await generateUsername(formData.full_name || 'user')
    setFormData({ ...formData, username: generated })
  }

  const copyShareUrl = async () => {
    const url = `${window.location.origin}/u/${userProfile.username}`
    await navigator.clipboard.writeText(url)
    setShareUrlCopied(true)
    setTimeout(() => setShareUrlCopied(false), 2000)
  }

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      setTimeout(() => setError(null), 3000)
      return
    }

    setUploadingPicture(true)
    setError(null)

    try {
      const imageUrl = await uploadProfilePicture(userId, file)
      setProfilePicture(imageUrl)

      const updated = await updateUserProfile(userId, {
        profile_picture_url: imageUrl,
      })

      if (updated) {
        setUserProfile(updated)
        setSuccess('Profile picture updated!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to upload profile picture',
      )
      setTimeout(() => setError(null), 5000)
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleRemoveProfilePicture = async () => {
    try {
      setUploadingPicture(true)
      setError(null)

      await deleteProfilePicture(userId)

      const updated = await updateUserProfile(userId, {
        profile_picture_url: null,
      })

      if (updated) {
        setUserProfile(updated)
        setProfilePicture(null)
        setSuccess('Profile picture removed!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error('Error removing profile picture:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to remove profile picture',
      )
      setTimeout(() => setError(null), 5000)
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!formData.full_name.trim()) {
        setError('Full name is required')
        setIsSaving(false)
        return
      }

      if (formData.username !== userProfile.username) {
        if (!formData.username.trim()) {
          setError('Username is required for public profile')
          setIsSaving(false)
          return
        }

        if (!/^[a-z0-9_]+$/.test(formData.username)) {
          setError(
            'Username can only contain lowercase letters, numbers, and underscores',
          )
          setIsSaving(false)
          return
        }

        const available = await checkUsernameAvailable(
          formData.username,
          userId,
        )
        if (!available) {
          setError('Username is already taken')
          setIsSaving(false)
          return
        }
      }

      const updateData: any = {
        full_name: formData.full_name.trim(),
        username: formData.username.trim() || null,
        bio: formData.bio.trim() || null,
        instagram_url: formData.instagram_url.trim() || null,
        twitter_url: formData.twitter_url.trim() || null,
        other_link: formData.other_link.trim() || null,
      }

      const updated = await updateUserProfile(userId, updateData)

      if (updated) {
        setUserProfile(updated)
        setSuccess('Profile updated successfully!')
        setIsEditing(false)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to update profile',
      )
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      full_name: userProfile.full_name || '',
      username: userProfile.username || '',
      bio: userProfile.bio || '',
      instagram_url: userProfile.instagram_url || '',
      twitter_url: userProfile.twitter_url || '',
      other_link: userProfile.other_link || '',
    })
    setError(null)
  }

  // ✅ Handle account deletion - pass auth_id (user.id from auth context)
  const handleDeleteAccount = async () => {
    try {
      console.log('🗑️ User confirmed account deletion')

      // userId here is actually the auth_id
      await deleteUserAccount(userId)

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }

      // Sign out and redirect
      await logout()
      router.push('/')
    } catch (error) {
      console.error('❌ Error deleting account:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete account. Please try again.',
      )
      setShowDeleteModal(false)
      setTimeout(() => setError(null), 5000)
    }
  }
  const getInitials = () => {
    const name = userProfile.full_name || userEmail || 'User'
    if (!name) return 'U'
    const nameParts = name.trim().split(' ').filter(Boolean)
    if (nameParts.length === 0) return 'U'
    if (nameParts.length === 1) {
      return (nameParts[0]?.[0] || 'U').toUpperCase()
    }
    return (
      (nameParts[0]?.[0] || '') + (nameParts[nameParts.length - 1]?.[0] || '')
    ).toUpperCase()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#5f462d' }}
          ></div>
          <p style={{ color: '#5f462d' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-15">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#5f462d' }}>
          My Profile
        </h1>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
          <div className="flex gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 mb-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row gap-8 mb-8">
          {/* Profile Picture */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover border-4 border-gray-300"
                />
              ) : (
                <div
                  className="w-40 h-40 rounded-full flex items-center justify-center text-white text-5xl font-bold border-4 border-gray-300"
                  style={{ background: '#5f462d' }}
                >
                  {getInitials()}
                </div>
              )}

              {isEditing && (
                <div className="absolute bottom-0 right-0 flex gap-2">
                  <label
                    htmlFor="profile-picture-upload"
                    className="bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      disabled={uploadingPicture}
                    />
                  </label>
                  {profilePicture && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      disabled={uploadingPicture}
                      className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2
                    className="text-3xl font-bold"
                    style={{ color: '#5f462d' }}
                  >
                    {userProfile.full_name || 'Add your name'}
                  </h2>
                  {/* Share Button - Next to Name */}
                  {userProfile.username && !isEditing && (
                    <button
                      onClick={copyShareUrl}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all"
                      style={{
                        background: shareUrlCopied ? '#22c55e' : '#5f462d',
                        color: 'white',
                      }}
                      title="Copy profile link"
                    >
                      {shareUrlCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="hidden sm:inline">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Share</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Username Badge */}
                {userProfile.username && !isEditing && (
                  <div className="flex items-center gap-2 mt-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                      <Globe className="w-3 h-3" />
                      /u/{userProfile.username}
                    </span>
                  </div>
                )}

                {userProfile.bio && !isEditing && (
                  <p
                    className="text-gray-600 mt-2 text-sm leading-relaxed max-w-md whitespace-pre-wrap"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    {userProfile.bio}
                  </p>
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors font-medium whitespace-nowrap ml-4"
                  style={{ background: '#5f462d' }}
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
            </div>

            {/* Social Links (View Mode) */}
            {!isEditing && (
              <div className="flex flex-wrap gap-3 mb-6">
                {userProfile.instagram_url && (
                  <a
                    href={userProfile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Instagram
                      className="w-4 h-4"
                      style={{ color: '#E1306C' }}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      Instagram
                    </span>
                  </a>
                )}
                {userProfile.twitter_url && (
                  <a
                    href={userProfile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Twitter className="w-4 h-4" style={{ color: '#1DA1F2' }} />
                    <span className="text-xs font-medium text-gray-700">
                      Twitter
                    </span>
                  </a>
                )}
                {userProfile.other_link && (
                  <a
                    href={userProfile.other_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink
                      className="w-4 h-4"
                      style={{ color: '#5f462d' }}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      Website
                    </span>
                  </a>
                )}
              </div>
            )}

            {/* Profile Details */}
            {!isEditing && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    Joined {formatDate(userProfile.created_at)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="border-t border-gray-200 pt-6">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: '#5f462d' }}
              >
                Edit Profile
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          full_name: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username (for public profile)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => {
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, '')
                          .substring(0, 30)
                        setFormData({ ...formData, username: value })
                      }}
                      className={`w-full pl-10 pr-4 py-2 border-2 rounded-lg focus:ring-2 focus:outline-none ${
                        checkingUsername
                          ? 'border-gray-300'
                          : usernameAvailable === true
                            ? 'border-green-500 focus:ring-green-500'
                            : usernameAvailable === false
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="your_username"
                      pattern="[a-z0-9_]+"
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                      </div>
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <Check className="absolute right-3 top-3 w-4 h-4 text-green-600" />
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <X className="absolute right-3 top-3 w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {usernameAvailable === false
                        ? '❌ Username already taken'
                        : usernameAvailable === true
                          ? '✅ Username available'
                          : 'Only lowercase letters, numbers, and underscores'}
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateUsername}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Generate from name
                    </button>
                  </div>
                  {formData.username && (
                    <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Your profile will be available at:{' '}
                      <span className="font-mono">/u/{formData.username}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / Description
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                    placeholder="Tell us about yourself... (max 250 characters)"
                    maxLength={250}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/250 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram URL
                    </label>
                    <div className="relative">
                      <Instagram
                        className="absolute left-3 top-3 w-4 h-4 text-gray-400"
                        style={{ color: '#E1306C' }}
                      />
                      <input
                        type="url"
                        value={formData.instagram_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instagram_url: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter / X URL
                    </label>
                    <div className="relative">
                      <Twitter
                        className="absolute left-3 top-3 w-4 h-4 text-gray-400"
                        style={{ color: '#1DA1F2' }}
                      />
                      <input
                        type="url"
                        value={formData.twitter_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            twitter_url: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website or Portfolio Link
                  </label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={formData.other_link}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          other_link: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSaving || uploadingPicture}
                className="flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving || uploadingPicture}
                className="flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 mb-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#5f462d' }}>
          My Links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/dashboard"
            className="p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3
              className="font-semibold text-lg mb-1"
              style={{ color: '#5f462d' }}
            >
              📚 My Links
            </h3>
            <p className="text-sm text-gray-600">
              View, add and organize your links.
            </p>
          </Link>
        </div>
      </div>

      {/* ✅ NEW: Delete Account Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 border border-red-200 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Danger Zone</h2>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all hover:shadow-lg"
        >
          <Trash2 className="w-5 h-5" />
          Delete My Account
        </button>
      </div>

      {/* ✅ NEW: Delete Account Modal */}
      <DeleteAccountModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
