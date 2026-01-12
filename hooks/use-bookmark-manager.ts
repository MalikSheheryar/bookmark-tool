'use client'

import { useState, useCallback, useRef } from 'react'

export interface Bookmark {
  siteName: string
  siteURL: string
}

export interface BookmarkData {
  categories: Record<string, Bookmark[]>
  categoryOrder: string[]
  categoryEmojis: Record<string, string>
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
}

export function useBookmarkManager() {
  const [bookmarkData, setBookmarkData] = useState<BookmarkData>({
    categories: {},
    categoryOrder: [],
    categoryEmojis: {},
  })

  const [modals, setModals] = useState<ModalState>({
    errorModal: false,
    categoryModal: false,
    shareCategoryModal: false,
    deleteModal: false,
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
    null
  )

  const toastTimeoutRef = useRef<NodeJS.Timeout>()

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
    []
  )

  const validateBookmarkName = (name: string): boolean => {
    const trimmed = name.trim()
    return (
      trimmed.length >= 3 &&
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

  const normalizeURL = (url: string): string => {
    return url.startsWith('http') ? url : `https://${url}`
  }

  const validateCategoryName = (name: string): boolean => {
    return (
      name.length >= 2 && name.length <= 30 && /^[a-zA-Z0-9\s]+$/.test(name)
    )
  }

  const addBookmark = useCallback(
    (formData: { name: string; url: string; category: string }) => {
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

      setBookmarkData((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          [formData.category]: [
            ...(prev.categories[formData.category] || []),
            bookmark,
          ],
        },
      }))

      showToast('Bookmark added successfully!')
      return true
    },
    [showModal, showToast]
  )

  const createOrUpdateCategory = useCallback(
    (name: string, editingCategoryName?: string | null) => {
      if (!validateCategoryName(name)) {
        showToast(
          'Category name must be 2-30 characters long and contain only letters, numbers, and spaces.',
          'error'
        )
        return false
      }

      if (editingCategoryName) {
        // We're editing an existing category
        return updateCategory(editingCategoryName, name)
      }

      // We're creating a new category
      if (bookmarkData.categories[name]) {
        showToast('Category already exists!', 'error')
        return false
      }

      setBookmarkData((prev) => ({
        ...prev,
        categories: { ...prev.categories, [name]: [] },
        categoryOrder: [...prev.categoryOrder, name],
        categoryEmojis: selectedEmoji
          ? { ...prev.categoryEmojis, [name]: selectedEmoji }
          : prev.categoryEmojis,
      }))

      closeModal('categoryModal')
      showToast(`Category "${name}" created successfully!`)
      return true
    },
    [bookmarkData.categories, selectedEmoji, closeModal, showToast]
  )

  const updateCategory = useCallback(
    (oldName: string, newName: string) => {
      if (
        newName === oldName &&
        selectedEmoji === bookmarkData.categoryEmojis[oldName]
      ) {
        closeModal('categoryModal')
        setEditingCategory(null)
        return true
      }

      if (newName !== oldName) {
        if (!validateCategoryName(newName)) {
          showToast(
            'Category name must be 2-30 characters long and contain only letters, numbers, and spaces.',
            'error'
          )
          return false
        }

        if (bookmarkData.categories[newName]) {
          showToast('Category name already exists!', 'error')
          return false
        }
      }

      setBookmarkData((prev) => {
        const newCategories = { ...prev.categories }
        const newEmojis = { ...prev.categoryEmojis }

        // If name changed, move bookmarks to new category name
        if (newName !== oldName) {
          newCategories[newName] = newCategories[oldName]
          delete newCategories[oldName]
        }

        // Update emoji mapping
        if (selectedEmoji) {
          newEmojis[newName] = selectedEmoji
        } else if (newName !== oldName && newEmojis[oldName]) {
          newEmojis[newName] = newEmojis[oldName]
          delete newEmojis[oldName]
        } else if (newName === oldName) {
          // Remove emoji if none selected for same name
          delete newEmojis[oldName]
        }

        // Clean up old name references if name changed
        if (newName !== oldName) {
          delete newEmojis[oldName]
        }

        // Update category order if name changed
        const newOrder =
          newName !== oldName
            ? prev.categoryOrder.map((cat) => (cat === oldName ? newName : cat))
            : prev.categoryOrder

        return {
          categories: newCategories,
          categoryOrder: newOrder,
          categoryEmojis: newEmojis,
        }
      })

      closeModal('categoryModal')
      setEditingCategory(null)
      showToast(`Category updated successfully!`)
      return true
    },
    [
      bookmarkData.categories,
      bookmarkData.categoryEmojis,
      selectedEmoji,
      closeModal,
      showToast,
    ]
  )

  const deleteCategory = useCallback(
    (categoryName: string) => {
      setBookmarkData((prev) => {
        const newCategories = { ...prev.categories }
        const newEmojis = { ...prev.categoryEmojis }

        delete newCategories[categoryName]
        delete newEmojis[categoryName]

        return {
          categories: newCategories,
          categoryOrder: prev.categoryOrder.filter(
            (cat) => cat !== categoryName
          ),
          categoryEmojis: newEmojis,
        }
      })

      showToast(`Category "${categoryName}" deleted successfully!`)
    },
    [showToast]
  )

  const deleteBookmark = useCallback(
    (categoryName: string, bookmarkIndex: number) => {
      const bookmark = bookmarkData.categories[categoryName][bookmarkIndex]

      setBookmarkData((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          [categoryName]: prev.categories[categoryName].filter(
            (_, index) => index !== bookmarkIndex
          ),
        },
      }))

      showToast(`"${bookmark.siteName}" deleted successfully!`)
    },
    [bookmarkData.categories, showToast]
  )

  const toggleCategory = useCallback((categoryName: string) => {
    // This would be handled by the CategorySection component's internal state
  }, [])

  const startEditingCategory = useCallback(
    (categoryName: string) => {
      setEditingCategory(categoryName)
      setSelectedEmoji(bookmarkData.categoryEmojis[categoryName] || null)
      showModal('categoryModal')
    },
    [bookmarkData.categoryEmojis, showModal]
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
        localStorage.setItem(storageKey, JSON.stringify(categoryData))

        const baseUrl =
          typeof window !== 'undefined' ? window.location.origin : ''
        const shareUrl = `${baseUrl}/shared/${shortId}`

        setDeleteTarget({ name: categoryName, shareUrl })
        showModal('shareCategoryModal')
      } catch (error) {
        console.error('Error creating share URL:', error)
        showToast('Error creating share link. Please try again.', 'error')
      }
    },
    [bookmarkData, showModal, showToast]
  )

  const reorderCategories = useCallback(
    (fromIndex: number, toIndex: number) => {
      setBookmarkData((prev) => {
        const newOrder = [...prev.categoryOrder]
        const [movedItem] = newOrder.splice(fromIndex, 1)
        newOrder.splice(toIndex, 0, movedItem)

        return {
          ...prev,
          categoryOrder: newOrder,
        }
      })
    },
    []
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
  }
}
