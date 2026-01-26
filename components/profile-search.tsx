// File: components/profile-search.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, X } from 'lucide-react'
import {
  searchPublicProfiles,
  type PublicProfile,
} from '@/lib/public-profile-service'

export function ProfileSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicProfile[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true)
        try {
          const profiles = await searchPublicProfiles(query.trim())
          setResults(profiles)
          // Only open dropdown if there are results OR still loading
          setIsOpen(profiles.length > 0 || loading)
        } catch (error) {
          console.error('Search error:', error)
          setResults([])
          setIsOpen(false)
        } finally {
          setLoading(false)
        }
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelectProfile = (username: string) => {
    router.push(`/u/${username}`)
    setQuery('')
    setIsOpen(false)
  }

  const getInitials = (profile: PublicProfile) => {
    const name = profile.full_name || profile.username
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Only show dropdown if loading OR there are results
  const shouldShowDropdown = isOpen && (loading || results.length > 0)

  return (
    <div ref={searchRef} className="relative" style={{ minWidth: '280px' }}>
      <style jsx>{`
        .search-container {
          position: relative;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #975226;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 40px 10px 40px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #975226;
          box-shadow: 0 0 0 3px rgba(151, 82, 38, 0.1);
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .clear-button {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          background: rgba(151, 82, 38, 0.1);
          color: #975226;
        }

        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s ease;
          border-bottom: 1px solid #f1f5f9;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover {
          background: rgba(151, 82, 38, 0.05);
        }

        .result-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #975226;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .result-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .result-info {
          flex: 1;
          min-width: 0;
        }

        .result-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .result-username {
          font-size: 12px;
          color: #64748b;
        }

        .result-categories {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .loading-state {
          padding: 24px;
          text-align: center;
          color: #64748b;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #f1f5f9;
          border-top-color: #975226;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 8px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .search-container {
            min-width: 100%;
          }
        }
      `}</style>

      <div className="search-container">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search profiles..."
            className="w-full pl-10 pr-3 py-2 search-input"
            onFocus={() => {
              if (query.trim().length >= 2 && results.length > 0) {
                setIsOpen(true)
              }
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setIsOpen(false)
              }}
              className="clear-button"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {shouldShowDropdown && (
          <div className="search-dropdown">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Searching...</p>
              </div>
            ) : (
              results.map((profile) => (
                <div
                  key={profile.id}
                  className="search-result-item"
                  onClick={() => handleSelectProfile(profile.username)}
                >
                  <div className="result-avatar">
                    {profile.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt={profile.username}
                      />
                    ) : (
                      getInitials(profile)
                    )}
                  </div>
                  <div className="result-info">
                    <div className="result-name">
                      {profile.full_name || profile.username}
                    </div>
                    <div className="result-username">@{profile.username}</div>
                    {profile.public_categories &&
                      profile.public_categories.length > 0 && (
                        <div className="result-categories">
                          {profile.public_categories.length} public{' '}
                          {profile.public_categories.length === 1
                            ? 'category'
                            : 'categories'}
                        </div>
                      )}
                  </div>
                  <User className="w-4 h-4" style={{ color: '#975226' }} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
