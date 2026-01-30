'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { ChevronDown, Bookmark, Link, Folder } from 'lucide-react'

interface BookmarkFormProps {
  categories: string[]
  onSubmit: (data: { name: string; url: string; category: string }) => boolean
  bookmarkData: any
  onCreateCategory: () => void
}

// ✅ ErrorModal Component
interface ErrorModalProps {
  show: boolean
  onClose: () => void
}

function ErrorModal({ show, onClose }: ErrorModalProps) {
  if (!show) return null

  return (
    <>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .modal-overlay.show {
          opacity: 1;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 0;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          display: flex;
          align-items: center;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-body p {
          margin: 0 0 16px 0;
          color: #374151;
          line-height: 1.6;
        }

        .modal-body ul {
          margin: 0;
          padding-left: 20px;
          color: #374151;
        }

        .modal-body li {
          margin: 8px 0;
          line-height: 1.6;
        }

        .modal-body strong {
          color: #1f2937;
          font-weight: 600;
        }
      `}</style>

      <div
        className={`modal-overlay ${show ? 'show' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">
              <span className="me-2">😊</span>
              Oops — almost there!
            </h3>

            <button className="modal-close" onClick={onClose}>
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
          <div className="modal-body">
            <p>
              <strong>Please check the following requirements:</strong>
            </p>
            <ul>
              <li>
                <strong>Link name:</strong>
                <ul>
                  <li>Must be at least 2 characters long</li>
                  <li>Only letters, numbers and spaces are allowed</li>
                  <li>Cannot start or end with a space</li>
                </ul>
              </li>
              <li>
                <strong>Website URL:</strong>
                <ul>
                  <li>Must be a valid URL format</li>
                  <li>https:// will be added automatically if missing</li>
                </ul>
              </li>
              <li>
                <strong>Category:</strong>
                <ul>
                  <li>
                    Please select an existing category or create a new one
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

// Utility function to convert emoji to Twemoji image URL
const getEmojiImageUrl = (emoji: string) => {
  const codePoint = [...emoji]
    .map((char) => {
      const code = char.codePointAt(0)
      return code ? code.toString(16) : ''
    })
    .join('-')

  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoint}.svg`
}

// Custom Twemoji component for BookmarkForm
const TwemojiEmoji: React.FC<{
  emoji: string
  className?: string
  size?: number
}> = ({ emoji, className = '', size = 16 }) => {
  const [imgSrc, setImgSrc] = useState<string>('')
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgSrc(getEmojiImageUrl(emoji))
    setImgError(false)
  }, [emoji])

  const handleError = () => {
    setImgError(true)
  }

  if (imgError) {
    return (
      <span className={className} style={{ fontSize: `${size}px` }}>
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={imgSrc}
      alt={emoji}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      onError={handleError}
    />
  )
}

const renderEmoji = (emoji: string) => {
  if (emoji.startsWith('http') || emoji.startsWith('/')) {
    return (
      <img
        src={emoji || '/placeholder.svg'}
        alt="emoji"
        className="custom-emoji-image"
      />
    )
  }

  return <TwemojiEmoji emoji={emoji} className="twemoji-emoji" size={16} />
}

export function BookmarkForm({
  categories,
  onSubmit,
  bookmarkData,
  onCreateCategory,
}: BookmarkFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: '',
  })

  const [validation, setValidation] = useState({
    name: '',
    url: '',
    category: '',
  })

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false) // ✅ NEW: State for error modal

  // Function to normalize URL by adding https:// if missing
  const normalizeURL = (url: string): string => {
    const trimmed = url.trim()
    if (!trimmed) return ''

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }

    return `https://${trimmed}`
  }

  const validateBookmarkName = (name: string): boolean => {
    // Check if starts or ends with space FIRST (before trimming)
    if (name.startsWith(' ') || name.endsWith(' ')) return false

    const trimmed = name.trim()

    // Must be at least 2 characters
    if (trimmed.length < 2) return false

    // Only letters, numbers, and spaces allowed
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) return false

    return true
  }

  const validateURL = (url: string): boolean => {
    try {
      const trimmed = url.trim()
      if (!trimmed) return false

      // Check for invalid characters that shouldn't be in URLs
      const invalidChars = /[,<>{}|\\^`\[\]]/
      if (invalidChars.test(trimmed)) return false

      const normalizedURL = normalizeURL(trimmed)
      if (!normalizedURL) return false

      const urlObj = new URL(normalizedURL)

      // Additional validation: must have a valid hostname
      if (!urlObj.hostname || urlObj.hostname.length < 3) return false

      // Must have at least one dot in hostname (e.g., google.com, not just "google")
      if (!urlObj.hostname.includes('.')) return false

      return true
    } catch {
      return false
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    let validationClass = ''
    if (field === 'name' && value) {
      validationClass = validateBookmarkName(value) ? 'valid' : 'invalid'
    } else if (field === 'url' && value) {
      validationClass = validateURL(value) ? 'valid' : 'invalid'
    } else if (field === 'category' && value) {
      validationClass = 'valid'
    }

    setValidation((prev) => ({ ...prev, [field]: validationClass }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields before submitting
    const hasErrors =
      !formData.name.trim() ||
      !validateBookmarkName(formData.name) ||
      !formData.url.trim() ||
      !validateURL(formData.url) ||
      !formData.category

    // If there are validation errors, show error modal
    if (hasErrors) {
      setShowErrorModal(true) // ✅ Show the modal instead of inline error
      // Update validation states to show errors
      setValidation({
        name: formData.name
          ? validateBookmarkName(formData.name)
            ? 'valid'
            : 'invalid'
          : 'invalid',
        url: formData.url
          ? validateURL(formData.url)
            ? 'valid'
            : 'invalid'
          : 'invalid',
        category: formData.category ? 'valid' : 'invalid',
      })
      return
    }

    // Normalize the URL before submitting
    const normalizedData = {
      ...formData,
      name: formData.name.trim(),
      url: normalizeURL(formData.url),
      category: formData.category,
    }

    console.log('Submitting bookmark:', normalizedData)

    // Try to submit
    const success = onSubmit(normalizedData)

    if (success) {
      // Reset form on success
      setFormData({ name: '', url: '', category: '' })
      setValidation({ name: '', url: '', category: '' })
    } else {
      // Show error modal if submission failed
      setShowErrorModal(true)
    }
  }

  const handleCategorySelect = (category: string) => {
    handleInputChange('category', category)
    setIsDropdownOpen(false)
  }

  useEffect(() => {
    const nameInput = document.getElementById('bookmarkName')
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 500)
    }
  }, [])

  return (
    <>
      <style jsx>{`
        .twemoji-emoji {
          display: inline-block !important;
          vertical-align: middle !important;
          margin-right: 6px;
        }

        .category-emoji {
          display: inline-flex;
          align-items: center;
          margin-right: 8px;
        }

        .category-emoji .twemoji-emoji {
          margin-right: 6px;
        }

        .selected-category {
          display: flex;
          align-items: center;
        }

        .selected-category .category-emoji {
          margin-right: 6px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          transition: all 0.2s ease;
        }

        .dropdown-item:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .dropdown-item .category-emoji {
          margin-right: 8px;
          min-width: 20px;
          display: flex;
          align-items: center;
        }

        .dropdown-item .category-name {
          flex: 1;
          margin-right: 8px;
        }

        .dropdown-item .bookmark-count {
          font-size: 0.875rem;
          color: #666;
          background: rgba(0, 0, 0, 0.1);
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 24px;
          text-align: center;
        }

        .custom-emoji-image {
          width: 16px;
          height: 16px;
          display: inline-block;
          vertical-align: middle;
          margin-right: 6px;
        }

        .create-category-top-section {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .create-category-top-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 3rem;
          background: linear-gradient(
            135deg,
            var(--main-color) 0%,
            hsl(var(--primary-h), var(--primary-s), 32%) 100%
          );
          color: var(--secondary-color);
          font-size: 1.5rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(139, 115, 85, 0.3);
          margin-bottom: 0.75rem;
        }

        .create-category-top-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(139, 115, 85, 0.4);
          background: linear-gradient(135deg, #9d8266 0%, #7a6352 100%);
        }

        .create-category-top-btn:active {
          transform: translateY(0);
        }

        .start-saving-text {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0;
        }

        @media (max-width: 640px) {
          .category-emoji .twemoji-emoji {
            width: 14px !important;
            height: 14px !important;
          }

          .dropdown-item .category-emoji .twemoji-emoji {
            width: 16px !important;
            height: 16px !important;
          }

          .create-category-top-btn {
            padding: 0.65rem 1.5rem;
            font-size: 0.95rem;
          }

          .start-saving-text {
            font-size: 0.875rem;
          }
        }
      `}</style>

      {/* ✅ Error Modal */}
      <ErrorModal
        show={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      />

      <section className="bookmark-inputs">
        {/* Create Category Button at Top */}
        <div className="create-category-top-section">
          <button
            type="button"
            onClick={onCreateCategory}
            className="create-category-top-btn"
          >
            <i className="fa-solid fa-plus"></i>
            Create Category
          </button>
          <p className="start-saving-text">Now start saving links</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row input-row">
            <div className="col-lg-4 col-md-6">
              <div className="modern-input-group">
                <div className="input-icon">
                  <Bookmark className="w-5 h-5 text-blue-500" />
                </div>
                <input
                  type="text"
                  autoFocus={false}
                  id="bookmarkName"
                  className={`modern-input ${validation.name}`}
                  placeholder="Link Name"
                  aria-label="Link Name"
                  autoComplete="off"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                {validation.name === 'valid' && (
                  <div className="validation-icon valid">
                    <i className="fa-solid fa-check"></i>
                  </div>
                )}
                {validation.name === 'invalid' && (
                  <div className="validation-icon invalid">
                    <i className="fa-solid fa-times"></i>
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="modern-input-group">
                <div className="input-icon">
                  <Link className="w-5 h-5 text-green-500" />
                </div>
                <input
                  type="text"
                  id="websiteURL"
                  className={`modern-input ${validation.url}`}
                  placeholder="Website URL (e.g., google.com)"
                  aria-label="Website URL"
                  autoComplete="off"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                />
                {validation.url === 'valid' && (
                  <div className="validation-icon valid">
                    <i className="fa-solid fa-check"></i>
                  </div>
                )}
                {validation.url === 'invalid' && (
                  <div className="validation-icon invalid">
                    <i className="fa-solid fa-times"></i>
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4 col-md-12">
              <div className="modern-dropdown-container">
                <div className="modern-input-group">
                  <div className="input-icon">
                    <Folder className="w-5 h-5 text-purple-500" />
                  </div>
                  <button
                    type="button"
                    className={`modern-dropdown-trigger ${
                      validation.category
                    } ${isDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-label="Select Category"
                  >
                    <span className="dropdown-text">
                      {formData.category ? (
                        <span className="selected-category">
                          {bookmarkData.categoryEmojis[formData.category] && (
                            <span className="category-emoji">
                              {renderEmoji(
                                bookmarkData.categoryEmojis[formData.category],
                              )}
                            </span>
                          )}
                          {formData.category}
                        </span>
                      ) : (
                        'Select Category'
                      )}
                    </span>
                    <ChevronDown
                      className={`dropdown-arrow ${
                        isDropdownOpen ? 'rotate' : ''
                      }`}
                    />
                  </button>
                  {validation.category === 'valid' && (
                    <div className="validation-icon valid">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  )}
                  {validation.category === 'invalid' && (
                    <div className="validation-icon invalid">
                      <i className="fa-solid fa-times"></i>
                    </div>
                  )}
                </div>

                {isDropdownOpen && (
                  <div className="modern-dropdown-menu">
                    {categories.length === 0 ? (
                      <div
                        className="dropdown-empty"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          padding: '30px 20px',
                        }}
                      >
                        <i
                          className="fa-solid fa-folder-plus"
                          style={{
                            fontSize: '32px',
                            color: '#5f462d',
                            marginBottom: '12px',
                          }}
                        ></i>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#5f462d',
                          }}
                        >
                          No categories yet
                        </p>

                        <p
                          style={{
                            marginTop: '4px',
                            fontSize: '13px',
                            color: '#6b7280',
                          }}
                        >
                          Create one to get started!
                        </p>
                      </div>
                    ) : (
                      categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className="dropdown-item"
                          onClick={() => handleCategorySelect(category)}
                        >
                          {bookmarkData.categoryEmojis[category] && (
                            <span className="category-emoji">
                              {renderEmoji(
                                bookmarkData.categoryEmojis[category],
                              )}
                            </span>
                          )}
                          <span className="category-name">{category}</span>
                          <span className="bookmark-count">
                            {bookmarkData.categories[category]?.length || 0}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button type="submit" className="submit-btn">
            <i className="fa-solid fa-plus me-2"></i>Add Link
          </button>
        </form>
      </section>
    </>
  )
}
