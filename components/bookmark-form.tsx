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
  const [errorMessage, setErrorMessage] = useState<string>('')

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
    setErrorMessage('') // Clear error message on input change

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
    setErrorMessage('')

    // Validate all fields before submitting
    const errors: string[] = []

    // Validate name
    if (!formData.name.trim()) {
      errors.push('❌ Link name is required')
    } else if (!validateBookmarkName(formData.name)) {
      const trimmed = formData.name.trim()
      if (formData.name.startsWith(' ') || formData.name.endsWith(' ')) {
        errors.push('❌ Link name cannot start or end with a space')
      } else if (trimmed.length < 2) {
        errors.push('❌ Link name must be at least 2 characters long')
      } else if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
        errors.push('❌ Link name can only contain letters, numbers and spaces')
      }
    }

    // Validate URL
    if (!formData.url.trim()) {
      errors.push('❌ Website URL is required')
    } else if (!validateURL(formData.url)) {
      errors.push(
        '❌ Website URL is not valid (e.g., google.com or https://google.com)',
      )
    }

    // Validate category
    if (!formData.category) {
      errors.push('❌ Please select a category')
    }

    // If there are validation errors, show them
    if (errors.length > 0) {
      setErrorMessage(errors.join('\n'))
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
      setErrorMessage('')
    } else {
      setErrorMessage(
        '❌ Failed to create bookmark. This link might already exist in this category.',
      )
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

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          color: #c33;
          font-size: 14px;
          white-space: pre-line;
          line-height: 1.6;
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
        }
      `}</style>

      <section className="bookmark-inputs">
        <form onSubmit={handleSubmit}>
          {errorMessage && <div className="error-message">{errorMessage}</div>}

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
            <i className="fa-solid fa-plus me-2"></i>Add Bookmark
          </button>
        </form>
      </section>
    </>
  )
}
