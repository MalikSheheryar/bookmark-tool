'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, Globe } from 'lucide-react'
import Link from 'next/link'

interface SharedBookmark {
  siteName: string
  siteURL: string
}

interface SharedCategoryData {
  name: string
  bookmarks: SharedBookmark[]
  emoji?: string
}

const EmojiDisplay = ({ emoji }: { emoji?: string }) => {
  const customEmojis: Record<string, string> = {
    'water-gun':
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_26-8-2025_22939_www.google.com-p6LtxbKDbqbMWp9bHRa6gaIQipkhzp.jpeg',
    'camera-flash':
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_26-8-2025_221142_www.google.com-FgXBuh5Jo1gvp5mibnnU5WhPrZvdL4.jpeg',
    eyes: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_26-8-2025_221439_www.google.com-keCMNsaduqi2pKVuZQHSXWLqy8c9wq.jpeg',
    ghost:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_26-8-2025_221455_www.google.com-ZPO6BC1B0NL5jlBBLjl9T5cZcw2ffj.jpeg',
    'movie-camera':
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_26-8-2025_22120_www.google.com-DRgzjv7wMCWNJROa418ZkWZmq70tgC.jpeg',
    pistol:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_26-8-2025_22914_www.google.com-w8k6fX0qjlEc8PMGlfk9ETD4EiYZ6h.jpeg',
    alien:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_26-8-2025_22115_www.google.com-wpY5lzSmOD95myydnVjzGcncsjm6Dt.jpeg',
    devil:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_26-8-2025_22105_www.google.com-D20W9tO7QVKYpYK2zIGGZwIXIkSzjU.jpeg',
  }

  if (emoji && customEmojis[emoji]) {
    return (
      <img
        src={customEmojis[emoji] || '/placeholder.svg'}
        alt={emoji}
        className="w-8 h-8 object-contain"
      />
    )
  }

  return <span className="text-3xl">{emoji || '📁'}</span>
}

export default function SharedCategoryPage() {
  const params = useParams()
  const [categoryData, setCategoryData] = useState<SharedCategoryData | null>(
    null
  )
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const shortId = params.category as string

    if (!shortId) {
      setError('No shared category ID found')
      return
    }

    try {
      const storageKey = `shared_category_${shortId}`
      const storedData = localStorage.getItem(storageKey)

      if (!storedData) {
        setError('Shared category not found or expired')
        return
      }

      const parsedData: SharedCategoryData = JSON.parse(storedData)
      setCategoryData(parsedData)
    } catch (error) {
      console.error('Error loading shared category:', error)
      setError('Invalid shared category data')
    }
  }, [params.category])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full text-center border">
          <div className="text-destructive text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Error Loading Shared Category
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Bookmark Manager
          </Link>
        </div>
      </div>
    )
  }

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared category...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-6 border">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookmark Manager
            </Link>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span className="text-sm">Shared Category</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <EmojiDisplay emoji={categoryData.emoji} />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {categoryData.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {categoryData.bookmarks.length} bookmark
                {categoryData.bookmarks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Bookmarks */}
        <div className="bg-card rounded-lg shadow-lg p-6 border">
          {categoryData.bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Bookmarks Yet
              </h3>
              <p className="text-muted-foreground">
                This category doesn't have any bookmarks.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryData.bookmarks.map((bookmark, index) => (
                <div
                  key={index}
                  className="group bg-secondary rounded-lg p-4 hover:bg-secondary/80 transition-colors border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {bookmark.siteName}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {bookmark.siteURL}
                      </p>
                    </div>
                    <a
                      href={bookmark.siteURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Open bookmark"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground">
          <p className="text-sm">
            This is a read-only view of shared bookmarks.
            <Link href="/" className="text-primary hover:text-primary/80 ml-1">
              Create your own bookmark manager
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
