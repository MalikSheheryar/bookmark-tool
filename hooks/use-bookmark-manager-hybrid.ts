'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSubscription, FREE_TIER_LIMITS } from '@/hooks/use-subscription'

export interface Bookmark {
  siteName: string
  siteURL: string
}

export interface BookmarkData {
  categories: Record<string, Bookmark[]>
  categoryOrder: string[]
  categoryEmojis: Record<string, string>
  categoryPublicStatus: Record<string, boolean>
}

export interface DragState {
  dragging: boolean
  draggedElement: HTMLElement | null
  draggedIndex: number
  dropIndex: number
}

export interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export interface ModalState {
  errorModal: boolean
  categoryModal: boolean
  shareCategoryModal: boolean
  deleteModal: boolean
  bookmarkEditModal: boolean // ✅ ADD THIS LINE
}

interface UseBookmarkManagerHybridOptions {
  userId?: string
  onSyncBookmark?: (bookmark: any) => Promise<void>
  onSyncCategory?: (category: any) => Promise<void>
  onDeleteBookmark?: (categoryName: string, index: number) => Promise<void>
  onDeleteCategory?: (categoryName: string) => Promise<void>
  onUpdateCategory?: (
    oldName: string,
    newName: string,
    emoji: string | null,
    isPublic?: boolean,
  ) => Promise<void>
  onUpdateBookmark?: (
    categoryName: string,
    bookmarkIndex: number,
    newData: { siteName: string; siteURL: string },
  ) => Promise<void>
}

const GUEST_STORAGE_KEY = 'bookmarkData_guest'

export function useBookmarkManagerHybrid(
  options: UseBookmarkManagerHybridOptions = {},
) {
  // UPDATED: Import new subscription functions
  const {
    canCreateBookmark,
    getRemainingBookmarks,
    canCreatePrivateCategory,
    isPremium,
  } = useSubscription()

  const [bookmarkData, setBookmarkData] = useState<BookmarkData>({
    categories: {},
    categoryOrder: [],
    categoryEmojis: {},
    categoryPublicStatus: {},
  })

  const [modals, setModals] = useState<ModalState>({
    errorModal: false,
    categoryModal: false,
    shareCategoryModal: false,
    deleteModal: false,
    bookmarkEditModal: false, // ✅ ADD THIS LINE
  })

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  })

  const [dragState, setDragState] = useState<DragState>({
    dragging: false,
    draggedElement: null,
    draggedIndex: -1,
    dropIndex: -1,
  })

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteType, setDeleteType] = useState<'category' | 'bookmark' | null>(
    null,
  )
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const toastTimeoutRef = useRef<NodeJS.Timeout>()
  const previousUserIdRef = useRef<string | undefined>(options.userId)

  // NEW: Helper function to count private categories
  const getPrivateCategoryCount = useCallback(() => {
    return Object.entries(bookmarkData.categoryPublicStatus).filter(
      ([_, isPublic]) => !isPublic,
    ).length
  }, [bookmarkData.categoryPublicStatus])

  // Load data on mount and when user changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadData = async () => {
      try {
        if (options.userId) {
          console.log('📥 Loading data from database for user:', options.userId)
          await loadFromDatabase()
        } else {
          console.log('📥 Loading guest data from localStorage')
          loadFromGuestStorage()
        }
        setIsDataLoaded(true)
      } catch (error) {
        console.error('❌ Error loading bookmarks:', error)
        setIsDataLoaded(true)
      }
    }

    const userChanged = previousUserIdRef.current !== options.userId

    if (userChanged) {
      if (options.userId) {
        console.log('👤 User logged in, loading user data from database')
        loadData()
      } else {
        console.log('👤 User logged out, loading guest data')
        loadFromGuestStorage()
        setIsDataLoaded(true)
      }
      previousUserIdRef.current = options.userId
    } else if (!isDataLoaded) {
      loadData()
    }
  }, [options.userId])

  const loadFromGuestStorage = () => {
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('✅ Loaded guest data:', parsed)
        // Ensure categoryPublicStatus exists
        if (!parsed.categoryPublicStatus) {
          parsed.categoryPublicStatus = {}
        }
        setBookmarkData(parsed)
      } else {
        console.log('📝 No guest data found, initializing empty state')
        setBookmarkData({
          categories: {},
          categoryOrder: [],
          categoryEmojis: {},
          categoryPublicStatus: {},
        })
      }
    } catch (error) {
      console.error('❌ Error loading guest bookmarks:', error)
      setBookmarkData({
        categories: {},
        categoryOrder: [],
        categoryEmojis: {},
        categoryPublicStatus: {},
      })
    }
  }

  const loadFromDatabase = async () => {
    if (!options.userId) return

    try {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      console.log('🔍 Fetching categories for user:', options.userId)
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', options.userId)
        .order('category_order', { ascending: true })

      if (catError) {
        console.error('❌ Error loading categories:', catError)
        throw catError
      }

      console.log(
        '✅ Loaded categories:',
        categories?.length || 0,
        'categories',
      )

      console.log('🔍 Fetching bookmarks for user:', options.userId)
      const { data: bookmarks, error: bookError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', options.userId)
        .order('created_at', { ascending: true })

      if (bookError) {
        console.error('❌ Error loading bookmarks:', bookError)
        throw bookError
      }

      console.log('✅ Loaded bookmarks:', bookmarks?.length || 0, 'bookmarks')

      const newCategories: Record<string, Bookmark[]> = {}
      const categoryOrder: string[] = []
      const categoryEmojis: Record<string, string> = {}
      const categoryPublicStatus: Record<string, boolean> = {}

      categories?.forEach((cat) => {
        newCategories[cat.name] = []
        categoryOrder.push(cat.name)
        if (cat.emoji) {
          categoryEmojis[cat.name] = cat.emoji
        }
        categoryPublicStatus[cat.name] = cat.is_public || false
      })

      bookmarks?.forEach((bookmark) => {
        if (newCategories[bookmark.category_name]) {
          newCategories[bookmark.category_name].push({
            siteName: bookmark.site_name,
            siteURL: bookmark.site_url,
          })
        }
      })

      console.log('📊 Final loaded data:', {
        categoriesCount: Object.keys(newCategories).length,
        totalBookmarks: bookmarks?.length || 0,
      })

      setBookmarkData({
        categories: newCategories,
        categoryOrder,
        categoryEmojis,
        categoryPublicStatus,
      })
    } catch (error) {
      console.error('❌ Error loading from database:', error)
      setBookmarkData({
        categories: {},
        categoryOrder: [],
        categoryEmojis: {},
        categoryPublicStatus: {},
      })
    }
  }

  // Save to localStorage for guest mode (backup auto-save)
  useEffect(() => {
    if (!isDataLoaded) return
    if (typeof window === 'undefined') return
    if (options.userId) return

    try {
      console.log('💾 Auto-saving guest data to localStorage')
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(bookmarkData))
    } catch (error) {
      console.error('❌ Error saving guest bookmarks:', error)
    }
  }, [bookmarkData, options.userId, isDataLoaded])

  const showModal = useCallback((modalId: keyof ModalState, data?: any) => {
    setModals((prev) => ({ ...prev, [modalId]: true }))

    if (modalId === 'deleteModal' && data) {
      setDeleteType(data.type)
      setDeleteTarget(data.target)
    }
  }, [])

  const closeModal = useCallback((modalId: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modalId]: false }))

    if (modalId === 'categoryModal') {
      setSelectedEmoji(null)
      setEditingCategory(null)
    }
  }, [])

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }

      setToast({ show: true, message, type })

      toastTimeoutRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }))
      }, 3000)
    },
    [],
  )

  const validateBookmarkName = (name: string): boolean => {
    const trimmed = name.trim()
    return (
      trimmed.length >= 2 &&
      /^[a-zA-Z0-9\s]+$/.test(trimmed) &&
      !trimmed.startsWith(' ') &&
      !trimmed.endsWith(' ')
    )
  }

  const validateURL = (url: string): boolean => {
    try {
      const normalizedURL = url.startsWith('http') ? url : `https://${url}`
      new URL(normalizedURL)
      return true
    } catch {
      return false
    }
  }

  // Replace the updateBookmark function in use-bookmark-manager-hybrid.ts
  // Find it around line 445 and replace with this:

  const updateBookmark = useCallback(
    async (
      categoryName: string,
      bookmarkIndex: number,
      newData: { siteName: string; siteURL: string },
    ) => {
      try {
        console.log('🔄 [updateBookmark] Starting update:', {
          categoryName,
          bookmarkIndex,
          newData,
        })

        // Validate bookmark exists
        const category = bookmarkData.categories[categoryName]
        if (!category || !category[bookmarkIndex]) {
          console.error('❌ Bookmark not found')
          showToast('Bookmark not found', 'error')
          return false
        }

        const oldBookmark = category[bookmarkIndex]
        console.log('📝 Old bookmark:', oldBookmark)

        // Create updated bookmarks array
        const updatedBookmarks = [...category]
        updatedBookmarks[bookmarkIndex] = {
          siteName: newData.siteName,
          siteURL: newData.siteURL,
        }

        // Update local state first
        setBookmarkData((prev) => {
          const updated = {
            ...prev,
            categories: {
              ...prev.categories,
              [categoryName]: updatedBookmarks,
            },
          }

          // For guest mode, save to localStorage
          if (!options.userId && typeof window !== 'undefined') {
            try {
              localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated))
              console.log('💾 Saved to localStorage')
            } catch (error) {
              console.error('❌ Error saving to localStorage:', error)
            }
          }

          return updated
        })

        // Sync to database if user is logged in
        if (options.onUpdateBookmark) {
          console.log('💾 Syncing to database...')
          await options.onUpdateBookmark(categoryName, bookmarkIndex, newData)
          console.log('✅ Synced to database')
        }

        showToast('Link updated successfully! ✅', 'success')
        return true
      } catch (error) {
        console.error('❌ Error updating bookmark:', error)
        showToast('Failed to update bookmark ❌', 'error')
        return false
      }
    },
    [bookmarkData.categories, options, showToast],
  )
  const normalizeURL = (url: string): string => {
    return url.startsWith('http') ? url : `https://${url}`
  }

  const validateCategoryName = (name: string): boolean => {
    return (
      name.length >= 2 && name.length <= 30 && /^[a-zA-Z0-9\s]+$/.test(name)
    )
  }

  const addBookmark = useCallback(
    async (formData: { name: string; url: string; category: string }) => {
      // Count current bookmarks
      const totalBookmarks = Object.values(bookmarkData.categories).reduce(
        (sum, bookmarks) => sum + bookmarks.length,
        0,
      )

      if (!canCreateBookmark(totalBookmarks)) {
        showToast(
          `Free plan limited to ${FREE_TIER_LIMITS.maxBookmarks} links. Upgrade to Premium for unlimited access!`,
          'error',
        )
        return false
      }

      if (
        !validateBookmarkName(formData.name) ||
        !validateURL(formData.url) ||
        !formData.category
      ) {
        showModal('errorModal')
        return false
      }

      const normalizedURL = normalizeURL(formData.url.trim())
      const bookmark: Bookmark = {
        siteName: formData.name.trim(),
        siteURL: normalizedURL,
      }

      if (options.userId && options.onSyncBookmark) {
        try {
          console.log('💾 Syncing bookmark to database')

          await options.onSyncBookmark({
            user_id: options.userId,
            site_name: bookmark.siteName,
            site_url: bookmark.siteURL,
            category_name: formData.category,
          })

          console.log('✅ Bookmark synced successfully')
        } catch (error) {
          console.error('❌ Error syncing bookmark:', error)
          showToast('Failed to save bookmark. Please try again.', 'error')
          return false
        }
      }

      setBookmarkData((prev) => {
        const updatedData = {
          ...prev,
          categories: {
            ...prev.categories,
            [formData.category]: [
              ...(prev.categories[formData.category] || []),
              bookmark,
            ],
          },
        }

        // For guest mode, immediately save to localStorage
        if (!options.userId && typeof window !== 'undefined') {
          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedData))
          } catch (error) {
            console.error('❌ Error saving to localStorage:', error)
          }
        }

        return updatedData
      })

      showToast('Link added successfully!')
      return true
    },
    [bookmarkData.categories, canCreateBookmark, options, showModal, showToast],
  )

  // This is the CRITICAL fix in use-bookmark-manager-hybrid.ts
  // Replace the createOrUpdateCategory function (around line 420)

  const createOrUpdateCategory = useCallback(
    async (
      name: string,
      editingCategoryName?: string | null,
      isPublic: boolean = false, // ✅ Make sure this parameter is here
    ) => {
      if (!validateCategoryName(name)) {
        showToast(
          'Category name must be 2-30 characters long and contain only letters, numbers, and spaces.',
          'error',
        )
        return false
      }

      if (editingCategoryName) {
        // When editing, pass isPublic to updateCategory
        return updateCategory(editingCategoryName, name, isPublic)
      }

      if (bookmarkData.categories[name]) {
        showToast('Category already exists!', 'error')
        return false
      }

      // Check private category limit for free users
      if (!isPublic && !isPremium) {
        const currentPrivateCount = getPrivateCategoryCount()
        if (!canCreatePrivateCategory(currentPrivateCount)) {
          showToast(
            `Free tier limited to ${FREE_TIER_LIMITS.maxPrivateCategories} private category. Upgrade to Premium for unlimited private categories!`,
            'error',
          )
          return false
        }
      }

      const newOrder = bookmarkData.categoryOrder.length

      // ✅ FIX: Sync to database with isPublic
      if (options.userId && options.onSyncCategory) {
        try {
          console.log(
            '💾 [createOrUpdateCategory] Syncing NEW category to database:',
            {
              name,
              emoji: selectedEmoji,
              isPublic, // ✅ Log this
            },
          )

          await options.onSyncCategory({
            user_id: options.userId,
            name,
            emoji: selectedEmoji,
            category_order: newOrder,
            is_public: isPublic, // ✅ THIS IS THE KEY FIX - pass isPublic
          })

          console.log(
            '✅ Category synced successfully with is_public =',
            isPublic,
          )
        } catch (error: any) {
          console.error('❌ Error syncing category:', error)

          if (
            error?.code === '23505' ||
            error?.message?.includes('duplicate') ||
            error?.message?.includes('unique') ||
            error?.message?.includes('already exists')
          ) {
            showToast('This category already exists in your account!', 'error')
          } else {
            showToast('Failed to create category. Please try again.', 'error')
          }
          return false
        }
      }

      // ✅ FIX: Update local state with isPublic
      setBookmarkData((prev) => {
        const updatedData = {
          ...prev,
          categories: { ...prev.categories, [name]: [] },
          categoryOrder: [...prev.categoryOrder, name],
          categoryEmojis: selectedEmoji
            ? { ...prev.categoryEmojis, [name]: selectedEmoji }
            : prev.categoryEmojis,
          categoryPublicStatus: {
            ...prev.categoryPublicStatus,
            [name]: isPublic, // ✅ Set the public status
          },
        }

        console.log('💾 [createOrUpdateCategory] Updated local state:', {
          categoryName: name,
          isPublic,
          allPublicStatus: updatedData.categoryPublicStatus,
        })

        // For guest mode, save to localStorage
        if (!options.userId && typeof window !== 'undefined') {
          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedData))
          } catch (error) {
            console.error('❌ Error saving to localStorage:', error)
          }
        }

        return updatedData
      })

      closeModal('categoryModal')
      showToast(`Category "${name}" created successfully!`)
      return true
    },
    [
      bookmarkData,
      selectedEmoji,
      closeModal,
      showToast,
      options,
      isPremium,
      canCreatePrivateCategory,
      getPrivateCategoryCount,
    ],
  )

  // UPDATED: updateCategory with private category limit check
  const updateCategory = useCallback(
    async (oldName: string, newName: string, isPublic?: boolean) => {
      const currentIsPublic = bookmarkData.categoryPublicStatus[oldName]

      if (
        newName === oldName &&
        selectedEmoji === bookmarkData.categoryEmojis[oldName] &&
        (isPublic === undefined || isPublic === currentIsPublic)
      ) {
        closeModal('categoryModal')
        setEditingCategory(null)
        return true
      }

      if (newName !== oldName) {
        if (!validateCategoryName(newName)) {
          showToast(
            'Category name must be 2-30 characters long and contain only letters, numbers, and spaces.',
            'error',
          )
          return false
        }

        if (bookmarkData.categories[newName]) {
          showToast('Category name already exists!', 'error')
          return false
        }
      }

      // NEW: Check if changing from public to private would exceed limit
      if (isPublic !== undefined && !isPremium) {
        const wasPublic = currentIsPublic
        const becomingPrivate = !isPublic

        // If changing from public to private, check the limit
        if (wasPublic && becomingPrivate) {
          const currentPrivateCount = getPrivateCategoryCount()
          if (!canCreatePrivateCategory(currentPrivateCount)) {
            showToast(
              `Free tier limited to ${FREE_TIER_LIMITS.maxPrivateCategories} private category. Upgrade to Premium for unlimited private categories!`,
              'error',
            )
            return false
          }
        }
      }

      if (options.userId && options.onUpdateCategory) {
        try {
          console.log('🔄 Updating category in database:', {
            oldName,
            newName,
            emoji: selectedEmoji,
            isPublic,
          })

          await options.onUpdateCategory(
            oldName,
            newName,
            selectedEmoji,
            isPublic,
          )
          console.log('✅ Category updated successfully')
        } catch (error: any) {
          console.error('❌ Error updating category:', error)

          if (error?.message?.includes('already exists')) {
            showToast('A category with this name already exists!', 'error')
          } else {
            showToast('Failed to update category. Please try again.', 'error')
          }
          return false
        }
      }

      setBookmarkData((prev) => {
        const newCategories = { ...prev.categories }
        const newEmojis = { ...prev.categoryEmojis }
        const newPublicStatus = { ...prev.categoryPublicStatus }

        if (newName !== oldName) {
          newCategories[newName] = newCategories[oldName]
          delete newCategories[oldName]
        }

        if (selectedEmoji) {
          newEmojis[newName] = selectedEmoji
        } else if (newName !== oldName && newEmojis[oldName]) {
          newEmojis[newName] = newEmojis[oldName]
          delete newEmojis[oldName]
        } else if (newName === oldName) {
          delete newEmojis[oldName]
        }

        // Handle public status
        if (isPublic !== undefined) {
          newPublicStatus[newName] = isPublic
          if (newName !== oldName) {
            delete newPublicStatus[oldName]
          }
        } else if (
          newName !== oldName &&
          newPublicStatus[oldName] !== undefined
        ) {
          newPublicStatus[newName] = newPublicStatus[oldName]
          delete newPublicStatus[oldName]
        }

        if (newName !== oldName) {
          delete newEmojis[oldName]
          delete newPublicStatus[oldName]
        }

        const newOrder =
          newName !== oldName
            ? prev.categoryOrder.map((cat) => (cat === oldName ? newName : cat))
            : prev.categoryOrder

        const updatedData = {
          categories: newCategories,
          categoryOrder: newOrder,
          categoryEmojis: newEmojis,
          categoryPublicStatus: newPublicStatus,
        }

        // For guest mode, immediately save to localStorage
        if (!options.userId && typeof window !== 'undefined') {
          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedData))
          } catch (error) {
            console.error('❌ Error saving to localStorage:', error)
          }
        }

        return updatedData
      })

      closeModal('categoryModal')
      setEditingCategory(null)
      showToast('Category updated successfully!')
      return true
    },
    [
      bookmarkData,
      selectedEmoji,
      closeModal,
      showToast,
      options,
      isPremium,
      canCreatePrivateCategory,
      getPrivateCategoryCount,
    ],
  )

  const deleteCategory = useCallback(
    async (categoryName: string) => {
      if (options.userId && options.onDeleteCategory) {
        try {
          console.log('🗑️ Deleting category from database:', categoryName)
          await options.onDeleteCategory(categoryName)
          console.log('✅ Category deleted successfully')
        } catch (error) {
          console.error('❌ Error deleting category:', error)
          showToast('Failed to delete category. Please try again.', 'error')
          return
        }
      }

      setBookmarkData((prev) => {
        const newCategories = { ...prev.categories }
        const newEmojis = { ...prev.categoryEmojis }
        const newPublicStatus = { ...prev.categoryPublicStatus }

        delete newCategories[categoryName]
        delete newEmojis[categoryName]
        delete newPublicStatus[categoryName]

        const updatedData = {
          categories: newCategories,
          categoryOrder: prev.categoryOrder.filter(
            (cat) => cat !== categoryName,
          ),
          categoryEmojis: newEmojis,
          categoryPublicStatus: newPublicStatus,
        }

        // For guest mode, immediately save to localStorage
        if (!options.userId && typeof window !== 'undefined') {
          try {
            console.log('💾 Immediately saving deletion to localStorage')
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedData))
          } catch (error) {
            console.error('❌ Error saving to localStorage:', error)
          }
        }

        return updatedData
      })

      showToast(`Category "${categoryName}" deleted successfully!`)
    },
    [options, showToast],
  )

  const deleteBookmark = useCallback(
    async (categoryName: string, bookmarkIndex: number) => {
      const bookmark = bookmarkData.categories[categoryName][bookmarkIndex]

      if (options.userId && options.onDeleteBookmark) {
        try {
          console.log('🗑️ Deleting bookmark from database:', bookmark.siteName)
          await options.onDeleteBookmark(categoryName, bookmarkIndex)
          console.log('✅ Bookmark deleted successfully')
        } catch (error) {
          console.error('❌ Error deleting bookmark:', error)
          showToast('Failed to delete bookmark. Please try again.', 'error')
          return
        }
      }

      setBookmarkData((prev) => {
        const updatedData = {
          ...prev,
          categories: {
            ...prev.categories,
            [categoryName]: prev.categories[categoryName].filter(
              (_, index) => index !== bookmarkIndex,
            ),
          },
        }

        // For guest mode, immediately save to localStorage
        if (!options.userId && typeof window !== 'undefined') {
          try {
            console.log(
              '💾 Immediately saving bookmark deletion to localStorage',
            )
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedData))
          } catch (error) {
            console.error('❌ Error saving to localStorage:', error)
          }
        }

        return updatedData
      })

      showToast(`"${bookmark.siteName}" deleted successfully!`)
    },
    [bookmarkData.categories, options, showToast],
  )

  const toggleCategory = useCallback(() => {}, [])

  const startEditingCategory = useCallback(
    (categoryName: string) => {
      setEditingCategory(categoryName)
      setSelectedEmoji(bookmarkData.categoryEmojis[categoryName] || null)
      showModal('categoryModal')
    },
    [bookmarkData.categoryEmojis, showModal],
  )

  const shareCategory = useCallback(
    (categoryName: string) => {
      const categoryData = {
        name: categoryName,
        bookmarks: bookmarkData.categories[categoryName],
        emoji: bookmarkData.categoryEmojis[categoryName],
      }

      try {
        const shortId =
          Math.random().toString(36).substring(2, 10) +
          Date.now().toString(36).slice(-4)

        const storageKey = `shared_category_${shortId}`

        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(categoryData))
        }

        const baseUrl =
          typeof window !== 'undefined' ? window.location.origin : ''
        const shareUrl = `${baseUrl}/shared/${shortId}`

        setDeleteTarget({ name: categoryName, shareUrl })
        showModal('shareCategoryModal')
      } catch (error) {
        console.error('❌ Error creating share URL:', error)
        showToast('Error creating share link. Please try again.', 'error')
      }
    },
    [bookmarkData, showModal, showToast],
  )

  const reorderCategories = useCallback(
    (fromIndex: number, toIndex: number) => {
      setBookmarkData((prev) => {
        const newOrder = [...prev.categoryOrder]
        const [movedItem] = newOrder.splice(fromIndex, 1)
        newOrder.splice(toIndex, 0, movedItem)

        const updatedData = {
          ...prev,
          categoryOrder: newOrder,
        }

        // For guest mode, immediately save to localStorage
        if (!options.userId && typeof window !== 'undefined') {
          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedData))
          } catch (error) {
            console.error('❌ Error saving to localStorage:', error)
          }
        }

        return updatedData
      })
    },
    [options.userId],
  )

  const toggleCategoryVisibility = useCallback(
    async (categoryName: string) => {
      const currentStatus =
        bookmarkData.categoryPublicStatus[categoryName] || false
      const newStatus = !currentStatus

      // NEW: Check private category limit when toggling from public to private
      if (!newStatus && !isPremium) {
        const currentPrivateCount = getPrivateCategoryCount()
        // Don't count the current category since it's currently public
        if (!canCreatePrivateCategory(currentPrivateCount)) {
          showToast(
            `Free tier limited to ${FREE_TIER_LIMITS.maxPrivateCategories} private category. Upgrade to Premium for unlimited private categories!`,
            'error',
          )
          return
        }
      }

      if (options.userId) {
        try {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()

          const { error } = await supabase
            .from('categories')
            .update({ is_public: newStatus })
            .eq('user_id', options.userId)
            .eq('name', categoryName)

          if (error) throw error

          setBookmarkData((prev) => ({
            ...prev,
            categoryPublicStatus: {
              ...prev.categoryPublicStatus,
              [categoryName]: newStatus,
            },
          }))

          showToast(
            `Category is now ${newStatus ? 'public' : 'private'}!`,
            'success',
          )
        } catch (error) {
          console.error('Error toggling visibility:', error)
          showToast('Failed to update visibility', 'error')
        }
      } else {
        // Guest mode
        setBookmarkData((prev) => {
          const updated = {
            ...prev,
            categoryPublicStatus: {
              ...prev.categoryPublicStatus,
              [categoryName]: newStatus,
            },
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated))
          }
          return updated
        })
        showToast(
          `Category is now ${newStatus ? 'public' : 'private'}!`,
          'success',
        )
      }
    },
    [
      bookmarkData.categoryPublicStatus,
      options.userId,
      showToast,
      isPremium,
      canCreatePrivateCategory,
      getPrivateCategoryCount,
    ],
  )

  return {
    bookmarkData,
    modals,
    toast,
    dragState,
    selectedEmoji,
    editingCategory,
    deleteTarget,
    deleteType,
    showModal,
    closeModal,
    showToast,
    addBookmark,
    createOrUpdateCategory,
    updateCategory,
    deleteCategory,
    deleteBookmark,
    toggleCategory,
    startEditingCategory,
    shareCategory,
    reorderCategories,
    setSelectedEmoji,
    toggleCategoryVisibility,
    updateBookmark,

    remainingBookmarks: getRemainingBookmarks(
      Object.values(bookmarkData.categories).reduce(
        (sum, b) => sum + b.length,
        0,
      ),
    ),
    getPrivateCategoryCount, // NEW: Export this helper function
  }
}
