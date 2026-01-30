'use client'

import { useState, useEffect } from 'react'
import { X, Bookmark, Link } from 'lucide-react'

interface BookmarkEditModalProps {
  show: boolean
  onClose: () => void
  onSave: (newName: string, newUrl: string) => void
  currentName: string
  currentUrl: string
  categoryName: string
}

export function BookmarkEditModal({
  show,
  onClose,
  onSave,
  currentName,
  currentUrl,
  categoryName,
}: BookmarkEditModalProps) {
  console.log('🎨 [BookmarkEditModal] Render:', {
    show,
    currentName,
    currentUrl,
    categoryName,
  })

  const [name, setName] = useState(currentName)
  const [url, setUrl] = useState(currentUrl)
  const [errors, setErrors] = useState({ name: '', url: '' })

  useEffect(() => {
    if (show) {
      console.log('👀 [BookmarkEditModal] Modal opened, resetting state')
      setName(currentName)
      setUrl(currentUrl)
      setErrors({ name: '', url: '' })
    }
  }, [show, currentName, currentUrl])

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, name: 'Name is required' }))
      return false
    }
    if (value.trim().length < 2) {
      setErrors((prev) => ({
        ...prev,
        name: 'Name must be at least 2 characters',
      }))
      return false
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(value.trim())) {
      setErrors((prev) => ({
        ...prev,
        name: 'Only letters, numbers, and spaces allowed',
      }))
      return false
    }
    setErrors((prev) => ({ ...prev, name: '' }))
    return true
  }

  const validateUrl = (value: string): boolean => {
    try {
      const trimmed = value.trim()
      if (!trimmed) {
        setErrors((prev) => ({ ...prev, url: 'URL is required' }))
        return false
      }

      const normalizedUrl = trimmed.startsWith('http')
        ? trimmed
        : `https://${trimmed}`
      const urlObj = new URL(normalizedUrl)

      if (!urlObj.hostname.includes('.')) {
        setErrors((prev) => ({ ...prev, url: 'Invalid URL format' }))
        return false
      }

      setErrors((prev) => ({ ...prev, url: '' }))
      return true
    } catch {
      setErrors((prev) => ({ ...prev, url: 'Invalid URL' }))
      return false
    }
  }

  const handleSave = () => {
    console.log('💾 [BookmarkEditModal] handleSave called')
    const isNameValid = validateName(name)
    const isUrlValid = validateUrl(url)

    if (!isNameValid || !isUrlValid) {
      console.log('❌ [BookmarkEditModal] Validation failed')
      return
    }

    const normalizedUrl = url.trim().startsWith('http')
      ? url.trim()
      : `https://${url.trim()}`

    console.log('✅ [BookmarkEditModal] Saving:', {
      name: name.trim(),
      url: normalizedUrl,
    })
    onSave(name.trim(), normalizedUrl)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!show) {
    console.log('🚫 [BookmarkEditModal] Not showing (show = false)')
    return null
  }

  console.log('✨ [BookmarkEditModal] Rendering modal overlay')

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
      style={{ zIndex: 99999 }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: '#5f462d' }}
          >
            <Bookmark className="w-5 h-5" />
            Edit Links
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Badge */}
        <div
          className="inline-block px-3 py-1 rounded-md text-sm font-semibold mb-4"
          style={{ background: 'rgba(95, 70, 45, 0.1)', color: '#5f462d' }}
        >
          Category: {categoryName}
        </div>

        {/* Bookmark Name Input */}
        <div className="mb-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Bookmark className="w-4 h-4" />
            Link Name
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <input
              type="text"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-all ${
                errors.name
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#5f462d]'
              } focus:ring-2 focus:ring-[#5f462d] focus:ring-opacity-20`}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                validateName(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder="My Bookmark"
              autoFocus
            />
          </div>
          {errors.name && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <span>⚠️</span>
              {errors.name}
            </div>
          )}
        </div>

        {/* Website URL Input */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Link className="w-4 h-4" />
            Website URL
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Link className="w-4 h-4" />
            </div>
            <input
              type="text"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-all ${
                errors.url
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#5f462d]'
              } focus:ring-2 focus:ring-[#5f462d] focus:ring-opacity-20`}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                validateUrl(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
            />
          </div>
          {errors.url && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <span>⚠️</span>
              {errors.url}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !url.trim()}
            className="flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: '#5f462d' }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
