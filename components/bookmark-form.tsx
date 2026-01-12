'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { ChevronDown, Bookmark, Link, Folder } from 'lucide-react'

interface BookmarkFormProps {
  categories: string[]
  onSubmit: (data: { name: string; url: string; category: string }) => boolean
  bookmarkData: any
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
    // Fallback to native emoji if Twemoji fails to load
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

  // Use Twemoji for Unicode emojis
  return <TwemojiEmoji emoji={emoji} className="twemoji-emoji" size={16} />
}

export function BookmarkForm({
  categories,
  onSubmit,
  bookmarkData,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Real-time validation
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

    if (onSubmit(formData)) {
      setFormData({ name: '', url: '', category: '' })
      setValidation({ name: '', url: '', category: '' })
    }
  }

  const handleCategorySelect = (category: string) => {
    handleInputChange('category', category)
    setIsDropdownOpen(false)
  }

  useEffect(() => {
    // Auto-focus on name input
    const nameInput = document.getElementById('bookmarkName')
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 500)
    }
  }, [])

  return (
    <>
      {/* Add custom styles for Twemoji in bookmark form */}
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

        /* Custom emoji image fallback */
        .custom-emoji-image {
          width: 16px;
          height: 16px;
          display: inline-block;
          vertical-align: middle;
          margin-right: 6px;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .category-emoji .twemoji-emoji {
            width: 14px !important;
            height: 14px !important;
          }

          .dropdown-item .category-emoji .twemoji-emoji {
            width: 16px !important;
            height: 16px !important;
          }
        }
      `}</style>

      <section className="bookmark-inputs">
        <form onSubmit={handleSubmit}>
          <div className="row input-row">
            <div className="col-lg-4 col-md-6">
              <div className="modern-input-group">
                <div className="input-icon">
                  <Bookmark className="w-5 h-5 text-blue-500" />
                </div>
                <input
                  type="text"
                  autoFocus={false} // Add this
                  id="bookmarkName"
                  className={`modern-input ${validation.name}`}
                  placeholder="Bookmark Name"
                  aria-label="Bookmark Name"
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
                  type="url"
                  id="websiteURL"
                  className={`modern-input ${validation.url}`}
                  placeholder="Website URL"
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
                                bookmarkData.categoryEmojis[formData.category]
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
                </div>

                {isDropdownOpen && (
                  <div className="modern-dropdown-menu">
                    {categories.length === 0 ? (
                      <div className="dropdown-empty">
                        <i className="fa-solid fa-folder-plus"></i>
                        <span>No categories yet. Create one first!</span>
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
                                bookmarkData.categoryEmojis[category]
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
            <i className="fa-solid fa-plus me-2"></i>Add Bookmark
          </button>
        </form>
      </section>
    </>
  )
}
