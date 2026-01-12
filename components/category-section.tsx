'use client'
import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { BookmarkData } from '@/hooks/use-bookmark-manager'

interface CategorySectionProps {
  bookmarkData: BookmarkData
  onToggleCategory: (categoryName: string) => void
  onEditCategory: (categoryName: string) => void
  onDeleteCategory: (categoryName: string) => void
  onDeleteBookmark: (
    categoryName: string,
    index: number,
    bookmarkName: string
  ) => void
  onShareCategory: (categoryName: string) => void
  onCreateCategory: () => void
  onReorderCategories: (fromIndex: number, toIndex: number) => void
  editingCategory: string | null
  onUpdateCategory: (oldName: string, newName: string) => boolean
}

interface SortableCategoryItemProps {
  categoryName: string
  index: number
  bookmarks: any[]
  emoji?: string
  isExpanded: boolean
  editingName: string
  onToggleCategory: (categoryName: string) => void
  onEditCategory: (categoryName: string) => void
  onDeleteCategory: (categoryName: string) => void
  onDeleteBookmark: (
    categoryName: string,
    index: number,
    bookmarkName: string
  ) => void
  onShareCategory: (categoryName: string) => void
  onSetEditingName: (name: string) => void
  onUpdateCategory: (oldName: string, newName: string) => boolean
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

// Custom Twemoji component for CategorySection
const TwemojiEmoji: React.FC<{
  emoji: string
  className?: string
  size?: number
}> = ({ emoji, className = '', size = 20 }) => {
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

const EmojiDisplay = ({ emoji }: { emoji?: string }) => {
  const defaultEmoji = '📁'
  const displayEmoji = emoji || defaultEmoji

  return (
    <TwemojiEmoji emoji={displayEmoji} className="category-emoji" size={20} />
  )
}

function SortableCategoryItem({
  categoryName,
  index,
  bookmarks,
  emoji,
  isExpanded,
  editingName,
  onToggleCategory,
  onEditCategory,
  onDeleteCategory,
  onDeleteBookmark,
  onShareCategory,
  onSetEditingName,
  onUpdateCategory,
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryName })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : 1,
  }

  const handleCategoryNameEdit = (categoryName: string, newName: string) => {
    if (newName.trim() === categoryName) {
      onSetEditingName('')
      return
    }

    if (onUpdateCategory(categoryName, newName.trim())) {
      onSetEditingName('')
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="category-item"
      {...attributes}
      {...listeners}
    >
      <div
        className="category-header-row"
        onClick={() => onToggleCategory(categoryName)}
        style={{ cursor: 'pointer' }}
      >
        <div className="category-info">
          <div className="category-icon">
            <EmojiDisplay emoji={emoji} />
          </div>

          {editingName === categoryName ? (
            <input
              type="text"
              className="category-name"
              defaultValue={categoryName}
              autoFocus
              onBlur={(e) =>
                handleCategoryNameEdit(categoryName, e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCategoryNameEdit(categoryName, e.currentTarget.value)
                } else if (e.key === 'Escape') {
                  onSetEditingName('')
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="category-name"
              onClick={(e) => {
                e.stopPropagation()
                onSetEditingName(categoryName)
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {categoryName}
            </span>
          )}

          <button
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation()
              onToggleCategory(categoryName)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title={isExpanded ? 'Collapse category' : 'Expand category'}
          >
            <i
              className={`fa-solid fa-chevron-down expand-icon ${
                isExpanded ? 'expanded' : ''
              }`}
            ></i>
          </button>

          <span className="bookmark-count">{bookmarks.length}</span>
        </div>

        <div className="category-actions">
          <button
            className="action-btn share-btn"
            onClick={(e) => {
              e.stopPropagation()
              onShareCategory(categoryName)
            }}
            title="Share Category"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <i className="fa-solid fa-share"></i>
          </button>
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation()
              onEditCategory(categoryName)
            }}
            title="Edit Category"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <i className="fa-solid fa-edit"></i>
          </button>
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteCategory(categoryName)
            }}
            title="Delete Category"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      {/* Bookmarks Dropdown */}
      <div className={`bookmarks-dropdown ${isExpanded ? 'expanded' : ''}`}>
        <div className="bookmarks-list">
          {bookmarks.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-bookmark"></i>
              <p>No bookmarks in this category yet.</p>
            </div>
          ) : (
            bookmarks.map((bookmark, bookmarkIndex) => (
              <div key={bookmarkIndex} className="bookmark-item">
                <a
                  href={bookmark.siteURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bookmark-link"
                >
                  <i className="fa-solid fa-bookmark bookmark-icon"></i>
                  <span className="bookmark-name">{bookmark.siteName}</span>
                  <i className="fa-solid fa-external-link external-icon"></i>
                </a>
                <div className="bookmark-actions">
                  <button
                    className="action-btn"
                    onClick={() =>
                      onDeleteBookmark(
                        categoryName,
                        bookmarkIndex,
                        bookmark.siteName
                      )
                    }
                    title="Delete Bookmark"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function CategorySection({
  bookmarkData,
  onToggleCategory,
  onEditCategory,
  onDeleteCategory,
  onDeleteBookmark,
  onShareCategory,
  onCreateCategory,
  onReorderCategories,
  editingCategory,
  onUpdateCategory,
}: CategorySectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  )
  const [editingName, setEditingName] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = bookmarkData.categoryOrder.indexOf(active.id as string)
      const newIndex = bookmarkData.categoryOrder.indexOf(over?.id as string)

      onReorderCategories(oldIndex, newIndex)
    }

    setActiveId(null)
  }

  return (
    <>
      {/* Add custom styles for Twemoji in category section */}
      <style jsx>{`
        .category-emoji {
          display: inline-block !important;
          vertical-align: middle !important;
          margin-right: 8px;
        }

        .category-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          min-width: 32px;
        }

        .category-icon .category-emoji {
          margin-right: 0;
        }

        .expand-btn {
          background: none;
          border: none;
          padding: 4px 8px;
          margin-left: 8px;
          margin-right: 8px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
        }

        .expand-btn:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .expand-btn .expand-icon {
          transition: transform 0.2s ease;
          font-size: 14px;
          color: #666;
        }

        .expand-btn .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .category-header-row {
          transition: background-color 0.2s ease;
        }

        .category-header-row:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }

        /* Ensure proper sizing in drag overlay */
        .dragging-overlay .category-emoji {
          width: 20px !important;
          height: 20px !important;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .category-icon {
            width: 28px;
            height: 28px;
            min-width: 28px;
          }

          .category-emoji {
            width: 18px !important;
            height: 18px !important;
          }

          .expand-btn {
            min-width: 28px;
            height: 28px;
            margin-left: 6px;
            margin-right: 6px;
          }
        }
      `}</style>

      <section className="category-section">
        <div className="category-header">
          <h2 className="category-title">
            <i className="fa-solid fa-folder-open me-2"></i>
            Your Categories
          </h2>
          <button
            onClick={onCreateCategory}
            className="create-category-btn btn"
          >
            <i className="fa-solid fa-folder-plus me-2"></i>Create Category
          </button>
        </div>

        <div className="categories-container">
          <div id="categoriesList">
            {bookmarkData.categoryOrder.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-folder-open"></i>
                <p>
                  No categories yet. Create your first category to get started!
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={bookmarkData.categoryOrder}
                  strategy={verticalListSortingStrategy}
                >
                  {bookmarkData.categoryOrder.map((categoryName, index) => {
                    const bookmarks =
                      bookmarkData.categories[categoryName] || []
                    const emoji = bookmarkData.categoryEmojis[categoryName]
                    const isExpanded = expandedCategories.has(categoryName)

                    return (
                      <SortableCategoryItem
                        key={categoryName}
                        categoryName={categoryName}
                        index={index}
                        bookmarks={bookmarks}
                        emoji={emoji}
                        isExpanded={isExpanded}
                        editingName={editingName}
                        onToggleCategory={toggleCategory}
                        onEditCategory={onEditCategory}
                        onDeleteCategory={onDeleteCategory}
                        onDeleteBookmark={onDeleteBookmark}
                        onShareCategory={onShareCategory}
                        onSetEditingName={setEditingName}
                        onUpdateCategory={onUpdateCategory}
                      />
                    )
                  })}
                </SortableContext>

                <DragOverlay>
                  {activeId ? (
                    <div className="category-item dragging-overlay">
                      <div className="category-header-row">
                        <div className="drag-handle">
                          <i className="fa-solid fa-grip-vertical"></i>
                        </div>
                        <div className="category-info">
                          <div className="category-icon">
                            <EmojiDisplay
                              emoji={bookmarkData.categoryEmojis[activeId]}
                            />
                          </div>
                          <span className="category-name">{activeId}</span>
                          <span className="bookmark-count">
                            {bookmarkData.categories[activeId]?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
