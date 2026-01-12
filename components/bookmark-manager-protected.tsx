'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBookmarkManagerHybrid } from '@/hooks/use-bookmark-manager-hybrid'
import { User, LogOut, Plus } from 'lucide-react'

interface BookmarkManagerProtectedProps {
  userId: string
}

export default function BookmarkManagerProtected({
  userId,
}: BookmarkManagerProtectedProps) {
  const router = useRouter()
  const [categoryName, setCategoryName] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [bookmarkName, setBookmarkName] = useState('')
  const [bookmarkUrl, setBookmarkUrl] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Initialize hybrid hook with database sync functions
  const {
    bookmarkData,
    modals,
    toast,
    selectedEmoji,
    editingCategory,
    deleteTarget,
    deleteType,
    showModal,
    closeModal,
    showToast,
    createOrUpdateCategory,
    deleteCategory: deleteCategoryLocal,
    deleteBookmark: deleteBookmarkLocal,
    startEditingCategory,
    setSelectedEmoji,
  } = useBookmarkManagerHybrid({
    userId, // Pass userId to enable database sync
    onSyncBookmark: async (bookmark) => {
      // Sync bookmark to database
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      try {
        const { error } = await supabase.from('bookmarks').insert({
          user_id: bookmark.user_id,
          site_name: bookmark.site_name,
          site_url: bookmark.site_url,
          category_name: bookmark.category_name,
        })

        if (error) throw error
        console.log('Bookmark synced to database')
      } catch (error) {
        console.error('Error syncing bookmark:', error)
        throw error
      }
    },
    onSyncCategory: async (category) => {
      // Sync category to database
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      try {
        const { error } = await supabase.from('categories').insert({
          user_id: category.user_id,
          name: category.name,
          emoji: category.emoji,
          category_order: category.category_order,
        })

        if (error) throw error
        console.log('Category synced to database')
      } catch (error) {
        console.error('Error syncing category:', error)
        throw error
      }
    },
    onDeleteBookmark: async (categoryName, bookmarkIndex) => {
      // Delete bookmark from database
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      try {
        const bookmark = bookmarkData.categories[categoryName][bookmarkIndex]

        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('site_name', bookmark.siteName)
          .eq('category_name', categoryName)

        if (error) throw error
        console.log('Bookmark deleted from database')
      } catch (error) {
        console.error('Error deleting bookmark:', error)
        throw error
      }
    },
    onDeleteCategory: async (categoryName) => {
      // Delete category from database
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('user_id', userId)
          .eq('name', categoryName)

        if (error) throw error
        console.log('Category deleted from database')
      } catch (error) {
        console.error('Error deleting category:', error)
        throw error
      }
    },
  })

  useEffect(() => {
    // Simulate loading
    setIsLoading(false)
  }, [])

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault()

    if (!bookmarkName.trim() || !bookmarkUrl.trim() || !selectedCategory) {
      showToast('Please fill all fields', 'error')
      return
    }

    const success = bookmarkData.categories[selectedCategory] ? true : false

    if (success) {
      setBookmarkName('')
      setBookmarkUrl('')
      setSelectedCategory('')
    }
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryName.trim()) {
      showToast('Category name is required', 'error')
      return
    }

    const success = createOrUpdateCategory(categoryName.trim())

    if (success) {
      setCategoryName('')
      setSelectedEmoji(null)
      setShowCategoryForm(false)
    }
  }

  const handleDeleteBookmark = (categoryName: string, index: number) => {
    if (window.confirm('Delete this bookmark?')) {
      deleteBookmarkLocal(categoryName, index)
    }
  }

  const handleDeleteCategory = (categoryName: string) => {
    if (
      window.confirm(`Delete category "${categoryName}" and all its bookmarks?`)
    ) {
      deleteCategoryLocal(categoryName)
    }
  }

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('@/lib/auth')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      showToast('Error signing out', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="pt-20 pb-10"
      style={{
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0f0e6 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1
                className="text-4xl font-bold mb-2"
                style={{ color: '#5f462d' }}
              >
                📚 My Bookmarks
              </h1>
              <p className="text-gray-600">
                Organize and manage your favorite websites
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Add Category Form */}
        {showCategoryForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-2 border-gray-200">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#5f462d' }}>
              Create New Category
            </h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Work, Personal, Learning"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Emoji (Optional)
                </label>
                <input
                  type="text"
                  value={selectedEmoji || ''}
                  onChange={(e) => setSelectedEmoji(e.target.value || null)}
                  maxLength={2}
                  placeholder="e.g. 💼"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Create Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false)
                    setCategoryName('')
                    setSelectedEmoji(null)
                  }}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Category Button */}
        {!showCategoryForm && (
          <button
            onClick={() => setShowCategoryForm(true)}
            className="mb-8 flex items-center gap-2 px-6 py-3 rounded font-semibold text-white transition-all"
            style={{ background: '#5f462d' }}
          >
            <Plus className="w-5 h-5" />
            Create Category
          </button>
        )}

        {/* Add Bookmark Form */}
        {bookmarkData.categoryOrder.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-2 border-gray-200">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#5f462d' }}>
              Add New Bookmark
            </h2>
            <form onSubmit={handleAddBookmark} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bookmark Name
                  </label>
                  <input
                    type="text"
                    value={bookmarkName}
                    onChange={(e) => setBookmarkName(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <input
                    type="url"
                    value={bookmarkUrl}
                    onChange={(e) => setBookmarkUrl(e.target.value)}
                    placeholder="e.g. google.com"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {bookmarkData.categoryOrder.map((cat) => (
                      <option key={cat} value={cat}>
                        {bookmarkData.categoryEmojis[cat]} {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              >
                Add Bookmark
              </button>
            </form>
          </div>
        )}

        {/* Categories Display */}
        {bookmarkData.categoryOrder.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkData.categoryOrder.map((categoryName) => (
              <div
                key={categoryName}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-lg font-bold flex items-center gap-2"
                    style={{ color: '#5f462d' }}
                  >
                    {bookmarkData.categoryEmojis[categoryName] && (
                      <span className="text-2xl">
                        {bookmarkData.categoryEmojis[categoryName]}
                      </span>
                    )}
                    {categoryName}
                  </h3>
                  <button
                    onClick={() => handleDeleteCategory(categoryName)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>

                {/* Bookmarks in Category */}
                <div className="space-y-2">
                  {bookmarkData.categories[categoryName]?.length > 0 ? (
                    bookmarkData.categories[categoryName].map(
                      (bookmark, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                        >
                          <a
                            href={bookmark.siteURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex-1 truncate text-sm font-medium"
                            title={bookmark.siteName}
                          >
                            {bookmark.siteName}
                          </a>
                          <button
                            onClick={() =>
                              handleDeleteBookmark(categoryName, index)
                            }
                            className="text-red-600 hover:text-red-700 font-bold ml-2"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      No bookmarks yet
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg mb-4">No categories yet</p>
            <p className="text-gray-400 text-sm">
              Create your first category to start organizing bookmarks
            </p>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-semibold shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  )
}
