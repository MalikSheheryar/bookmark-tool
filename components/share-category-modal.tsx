// File: components/share-category-modal.tsx (FIXED - Optimized dropdown UI)
'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Search,
  Check,
  Send,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { sendCategoryShare, searchUsersForSharing } from '@/lib/inbox-service'
import { getUserCategories } from '@/lib/category-service'

interface ShareCategoryModalProps {
  show: boolean
  onClose: () => void
  currentUserId: string
  // ✅ REMOVED: currentUsername - not needed anymore!
}

interface UserOption {
  id: string
  username: string
  full_name: string | null
  profile_picture_url: string | null
}

interface Category {
  id: string
  name: string
  emoji: string | null
}

export function ShareCategoryModal({
  show,
  onClose,
  currentUserId,
}: ShareCategoryModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [userResults, setUserResults] = useState<UserOption[]>([])
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  )
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getUserCategories(currentUserId)
        setCategories(cats)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    if (show && currentUserId) {
      fetchCategories()
    }
  }, [show, currentUserId])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true)
        try {
          const results = await searchUsersForSharing(
            searchQuery.trim(),
            currentUserId
          )
          setUserResults(results)
        } catch (error) {
          console.error('Error searching users:', error)
        } finally {
          setSearching(false)
        }
      } else {
        setUserResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, currentUserId])

  const handleSelectUser = (user: UserOption) => {
    setSelectedUser(user)
    setStep(2)
  }

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category)
    setStep(3)
  }

  const handleSend = async () => {
    if (!selectedUser || !selectedCategory) return

    setLoading(true)
    setError(null)

    try {
      // ✅ FIXED: URL will be generated in the service with share token
      // We pass empty string as placeholder (will be replaced in service)
      await sendCategoryShare(currentUserId, {
        recipientId: selectedUser.id,
        categoryName: selectedCategory.name,
        categoryUrl: '', // Will be generated in service
        note: note.trim() || undefined,
      })

      console.log('✅ Share sent successfully!')
      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      console.error('❌ Error sending share:', err)
      setError(err instanceof Error ? err.message : 'Failed to send share')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setSearchQuery('')
    setUserResults([])
    setSelectedUser(null)
    setSelectedCategory(null)
    setNote('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  const getInitials = (user: UserOption) => {
    const name = user.full_name || user.username
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ zIndex: 9999999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 overflow-hidden"
        style={{ zIndex: 10000000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-8 py-6 flex items-center justify-between relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #5f462d 0%, #7d5e3f 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Share Category</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 relative z-10 group"
          >
            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-in zoom-in duration-500 shadow-xl shadow-green-500/30">
                <Check
                  className="w-12 h-12 text-white animate-in zoom-in duration-300"
                  strokeWidth={3}
                />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[#5f462d] to-[#7d5e3f] bg-clip-text text-transparent">
                Share Sent Successfully!
              </h3>
              <p className="text-gray-600 text-lg">
                {selectedUser?.full_name || selectedUser?.username} will receive
                your category share
              </p>
            </div>
          ) : (
            <>
              {/* Step Indicator */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map((stepNum, idx) => (
                  <div key={stepNum} className="flex items-center flex-1">
                    <div className="relative flex items-center justify-center w-full">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          step >= stepNum
                            ? step > stepNum
                              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/30 scale-110'
                              : 'bg-gradient-to-br from-[#5f462d] to-[#7d5e3f] text-white shadow-lg shadow-[#5f462d]/30 scale-110'
                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                        }`}
                      >
                        {step > stepNum ? (
                          <Check className="w-5 h-5" strokeWidth={3} />
                        ) : (
                          stepNum
                        )}
                      </div>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`h-1 flex-1 transition-all duration-300 rounded-full ${
                          step > stepNum + 1
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : step === stepNum + 1
                            ? 'bg-gradient-to-r from-[#5f462d] to-[#7d5e3f]'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              {/* Step 1: Select User */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#5f462d] to-[#7d5e3f] bg-clip-text text-transparent">
                    Step 1: Choose Recipient
                  </h4>
                  <p className="text-gray-500 mb-6 text-sm">
                    Search for a user to share your category with
                  </p>

                  <div className="relative mb-6">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#5f462d] focus:ring-4 focus:ring-[#5f462d]/10 transition-all duration-200 text-base shadow-sm"
                      placeholder="Search by username or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {searching && (
                    <div className="text-center py-12">
                      <div
                        className="animate-spin rounded-full h-10 w-10 border-b-4 mx-auto mb-3"
                        style={{ borderColor: '#5f462d' }}
                      />
                      <p className="text-sm text-gray-500 font-medium">
                        Searching users...
                      </p>
                    </div>
                  )}

                  {!searching &&
                    searchQuery.length >= 2 &&
                    userResults.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No users found
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try a different search term
                        </p>
                      </div>
                    )}

                  {!searching && userResults.length > 0 && (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {userResults.map((user) => (
                        <div
                          key={user.id}
                          className="group p-3 border border-gray-200 rounded-xl cursor-pointer transition-all duration-200  hover:shadow-md"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            {user.profile_picture_url ? (
                              <img
                                src={user.profile_picture_url}
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-[#5f462d] transition-all"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                                style={{
                                  background:
                                    'linear-gradient(135deg, #5f462d 0%, #7d5e3f 100%)',
                                }}
                              >
                                {getInitials(user)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate text-sm">
                                {user.full_name || user.username}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                @{user.username}
                              </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-7 h-7 rounded-full bg-[#5f462d] flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Select Category */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#5f462d] to-[#7d5e3f] bg-clip-text text-transparent">
                    Step 2: Select Category
                  </h4>
                  <p className="text-gray-500 mb-6 text-sm">
                    Choose which category to share
                  </p>

                  {selectedUser && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-4 mb-6">
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                        Sharing with
                      </p>
                      <p className="font-bold text-gray-900 text-base">
                        {selectedUser.full_name || selectedUser.username}{' '}
                        <span className="text-gray-500 font-normal">
                          @{selectedUser.username}
                        </span>
                      </p>
                    </div>
                  )}

                  {categories.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-3xl">📁</span>
                      </div>
                      <p className="text-gray-500 font-medium">
                        No categories yet
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Create a category first to share it
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="group p-3 border border-gray-200 rounded-xl cursor-pointer transition-all duration-200 hover:border-[#5f462d] hover:bg-gradient-to-r hover:from-[#5f462d]/5 hover:to-transparent hover:shadow-md"
                          onClick={() => handleSelectCategory(category)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-shadow">
                              {category.emoji || '📁'}
                            </div>
                            <p className="font-semibold text-gray-900 flex-1 text-sm">
                              {category.name}
                            </p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-7 h-7 rounded-full bg-[#5f462d] flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Add Note */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#5f462d] to-[#7d5e3f] bg-clip-text text-transparent">
                    Step 3: Add Personal Touch
                  </h4>
                  <p className="text-gray-500 mb-6 text-sm">
                    Optional: Add a message to your share
                  </p>

                  {selectedUser && selectedCategory && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl p-4 mb-6">
                      <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-2">
                        Summary
                      </p>
                      <div className="space-y-1.5">
                        <p className="text-sm">
                          <span className="font-semibold text-gray-700">
                            To:
                          </span>{' '}
                          <span className="text-gray-900">
                            {selectedUser.full_name || selectedUser.username}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold text-gray-700">
                            Category:
                          </span>{' '}
                          <span className="text-gray-900">
                            {selectedCategory.emoji} {selectedCategory.name}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Personal Message
                  </label>
                  <textarea
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-[#5f462d] focus:ring-4 focus:ring-[#5f462d]/10 transition-all duration-200 text-base shadow-sm"
                    placeholder="e.g., Check out these amazing resources, I think you'll find them useful!"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 100))}
                    maxLength={100}
                    rows={4}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500">
                      Make it personal and friendly
                    </p>
                    <span
                      className={`text-sm font-medium transition-colors ${
                        note.length > 80 ? 'text-orange-500' : 'text-gray-500'
                      }`}
                    >
                      {note.length}/100
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-between gap-4">
            <button
              onClick={() => {
                if (step === 1) {
                  handleClose()
                } else {
                  setStep((step - 1) as 1 | 2)
                }
              }}
              className="px-8 py-3.5 rounded-xl font-bold bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow"
              disabled={loading}
            >
              {step === 1 ? 'Cancel' : '← Back'}
            </button>

            {step === 3 ? (
              <button
                onClick={handleSend}
                className="px-8 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:shadow-xl disabled:opacity-50 flex items-center gap-2 shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #5f462d 0%, #7d5e3f 100%)',
                }}
                disabled={loading || !selectedUser || !selectedCategory}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Share
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setStep((step + 1) as 2 | 3)}
                className="px-8 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:shadow-xl disabled:opacity-50 shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #5f462d 0%, #7d5e3f 100%)',
                }}
                disabled={
                  (step === 1 && !selectedUser) ||
                  (step === 2 && !selectedCategory)
                }
              >
                Continue →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
