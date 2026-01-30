'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { BookmarkForm } from '@/components/bookmark-form'
import { CategorySection } from '@/components/category-section'
import { ErrorModal } from '@/components/error-modal'
import { CategoryModal } from '@/components/category-modal'
import { ShareModal } from '@/components/share-modal'
import { DeleteModal } from '@/components/delete-modal'
import { BookmarkEditModal } from '@/components/bookmark-edit-modal'
import { Toast } from '@/components/toast'
import { useBookmarkManagerHybrid } from '@/hooks/use-bookmark-manager-hybrid'
import '@/styles/bookmark-manager.css'

export default function BookmarkManager() {
  const { dbUser, isLoading: authLoading } = useAuth()

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<{
    categoryName: string
    index: number
    bookmark: any
  } | null>(null)

  const {
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
    updateBookmark,
    toggleCategory,
    startEditingCategory,
    shareCategory,
    reorderCategories,
    setSelectedEmoji,
    toggleCategoryVisibility,
    getPrivateCategoryCount,
  } = useBookmarkManagerHybrid({
    userId: dbUser?.id,
    onSyncBookmark: dbUser?.id
      ? async (bookmark) => {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()

          try {
            const { data, error } = await supabase
              .from('bookmarks')
              .insert({
                user_id: bookmark.user_id,
                site_name: bookmark.site_name,
                site_url: bookmark.site_url,
                category_name: bookmark.category_name,
              })
              .select()

            if (error) throw error
          } catch (error) {
            console.error('❌ Error syncing bookmark:', error)
            throw error
          }
        }
      : undefined,
    onSyncCategory: dbUser?.id
      ? async (category) => {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()

          try {
            console.log(
              '💾 [onSyncCategory] Syncing category with data:',
              category,
            )

            const { data: existingCategory } = await supabase
              .from('categories')
              .select('id')
              .eq('user_id', category.user_id)
              .eq('name', category.name)
              .maybeSingle()

            if (existingCategory) {
              throw new Error('Category already exists')
            }

            const { data, error } = await supabase
              .from('categories')
              .insert({
                user_id: category.user_id,
                name: category.name,
                emoji: category.emoji,
                category_order: category.category_order,
                is_public: category.is_public ?? false,
              })
              .select()

            if (error) {
              console.error('❌ Database error:', error)
              throw error
            }

            console.log('✅ Category synced successfully:', data)
          } catch (error) {
            console.error('❌ Error syncing category:', error)
            throw error
          }
        }
      : undefined,
    onUpdateCategory: dbUser?.id
      ? async (oldName, newName, emoji, isPublic) => {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()

          try {
            console.log('🔄 [onUpdateCategory] Updating category:', {
              oldName,
              newName,
              emoji,
              isPublic,
            })

            const updateData: any = { name: newName }

            if (emoji !== undefined) {
              updateData.emoji = emoji
            }

            if (isPublic !== undefined) {
              updateData.is_public = isPublic
            }

            const { error: categoryError } = await supabase
              .from('categories')
              .update(updateData)
              .eq('user_id', dbUser.id)
              .eq('name', oldName)

            if (categoryError) {
              console.error('❌ Category update error:', categoryError)
              throw categoryError
            }

            if (oldName !== newName) {
              const { error: bookmarkError } = await supabase
                .from('bookmarks')
                .update({ category_name: newName })
                .eq('user_id', dbUser.id)
                .eq('category_name', oldName)

              if (bookmarkError) {
                console.error('❌ Bookmark update error:', bookmarkError)
                throw bookmarkError
              }
            }

            console.log('✅ Category updated successfully')
          } catch (error) {
            console.error('❌ Error updating category:', error)
            throw error
          }
        }
      : undefined,
    onDeleteBookmark: dbUser?.id
      ? async (categoryName, bookmarkIndex) => {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()

          try {
            const bookmark =
              bookmarkData.categories[categoryName][bookmarkIndex]

            const { error } = await supabase
              .from('bookmarks')
              .delete()
              .eq('user_id', dbUser.id)
              .eq('site_name', bookmark.siteName)
              .eq('category_name', categoryName)

            if (error) throw error
          } catch (error) {
            console.error('❌ Error deleting bookmark:', error)
            throw error
          }
        }
      : undefined,
    onDeleteCategory: dbUser?.id
      ? async (categoryName) => {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()

          try {
            const { error: bookmarkError } = await supabase
              .from('bookmarks')
              .delete()
              .eq('user_id', dbUser.id)
              .eq('category_name', categoryName)

            if (bookmarkError) throw bookmarkError

            const { error: categoryError } = await supabase
              .from('categories')
              .delete()
              .eq('user_id', dbUser.id)
              .eq('name', categoryName)

            if (categoryError) throw categoryError
          } catch (error) {
            console.error('❌ Error deleting category:', error)
            throw error
          }
        }
      : undefined,
    onUpdateBookmark: dbUser?.id
      ? async (categoryName, bookmarkIndex, newData) => {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()

          try {
            const oldBookmark =
              bookmarkData.categories[categoryName][bookmarkIndex]

            const { error } = await supabase
              .from('bookmarks')
              .update({
                site_name: newData.siteName,
                site_url: newData.siteURL,
              })
              .eq('user_id', dbUser.id)
              .eq('category_name', categoryName)
              .eq('site_name', oldBookmark.siteName)

            if (error) throw error
          } catch (error) {
            console.error('❌ Error updating bookmark:', error)
            throw error
          }
        }
      : undefined,
  })

  const handleEditBookmark = (
    categoryName: string,
    index: number,
    bookmark: any,
  ) => {
    console.log('🖊️ [handleEditBookmark] Called:', {
      categoryName,
      index,
      bookmark,
    })
    setEditingBookmark({ categoryName, index, bookmark })
    setShowEditModal(true)
  }

  const handleSaveBookmark = async (newName: string, newUrl: string) => {
    console.log('💾 [handleSaveBookmark] Saving:', { newName, newUrl })

    if (editingBookmark) {
      const success = await updateBookmark(
        editingBookmark.categoryName,
        editingBookmark.index,
        { siteName: newName, siteURL: newUrl },
      )

      if (success) {
        setEditingBookmark(null)
        setShowEditModal(false)
      }
    }
  }

  const handleCloseEditModal = () => {
    console.log('❌ [handleCloseEditModal] Closing')
    setShowEditModal(false)
    setEditingBookmark(null)
  }

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        addBookmark({ name: '', url: '', category: '' })
      }

      if (e.key === 'Escape') {
        if (showEditModal) {
          handleCloseEditModal()
        }
        Object.keys(modals).forEach((modalId) => {
          if (modals[modalId as keyof typeof modals]) {
            closeModal(modalId as keyof typeof modals)
          }
        })
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        showModal('categoryModal')
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [modals, closeModal, showModal, addBookmark, showEditModal])

  if (authLoading) {
    return (
      <div className="bookmark-manager">
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bookmark-manager py-12">
      <header className="bookmark-header">
        <div className="header-container">
          <h1
            className="
    flex flex-wrap items-center justify-center gap-2
    text-center font-semibold
    leading-tight
    mt-10 sm:mt-0
  "
            style={{
              margin: '0',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
            }}
          >
            <i
              className="fa-regular fa-bookmark"
              style={{ fontSize: '1rem' }}
            />
            <span>Create categories to organise your links</span>
            <i
              className="fa-regular fa-bookmark"
              style={{ fontSize: '1rem' }}
            />
          </h1>
        </div>
      </header>

      <main className="main-wrapper">
        <div className="main-container">
          {/* ✅ UPDATED: Pass onCreateCategory prop to BookmarkForm */}
          <BookmarkForm
            categories={Object.keys(bookmarkData.categories)}
            onSubmit={addBookmark}
            bookmarkData={bookmarkData}
            onCreateCategory={() => showModal('categoryModal')}
          />

          <CategorySection
            bookmarkData={bookmarkData}
            onToggleCategory={toggleCategory}
            onEditCategory={startEditingCategory}
            onDeleteCategory={(name) =>
              showModal('deleteModal', { type: 'category', target: name, name })
            }
            onDeleteBookmark={(categoryName, index, bookmarkName) =>
              showModal('deleteModal', {
                type: 'bookmark',
                target: { category: categoryName, index },
                name: bookmarkName,
              })
            }
            onShareCategory={shareCategory}
            onCreateCategory={() => showModal('categoryModal')}
            onReorderCategories={reorderCategories}
            editingCategory={editingCategory}
            onUpdateCategory={updateCategory}
            onToggleVisibility={toggleCategoryVisibility}
            onEditBookmark={handleEditBookmark}
          />
        </div>
      </main>

      <ErrorModal
        show={modals.errorModal}
        onClose={() => closeModal('errorModal')}
      />

      <CategoryModal
        show={modals.categoryModal}
        onClose={() => closeModal('categoryModal')}
        onSave={createOrUpdateCategory}
        selectedEmoji={selectedEmoji}
        onEmojiSelect={setSelectedEmoji}
        editingCategory={editingCategory}
        currentPrivateCategoryCount={getPrivateCategoryCount()}
        currentIsPublic={
          editingCategory
            ? bookmarkData.categoryPublicStatus[editingCategory] || false
            : false
        }
      />

      <ShareModal
        show={modals.shareCategoryModal}
        onClose={() => closeModal('shareCategoryModal')}
        categoryName={deleteTarget?.name || ''}
        shareUrl={deleteTarget?.shareUrl || ''}
      />

      <DeleteModal
        show={modals.deleteModal}
        onClose={() => closeModal('deleteModal')}
        onConfirm={() => {
          if (deleteType === 'category') {
            deleteCategory(deleteTarget)
          } else if (deleteType === 'bookmark') {
            deleteBookmark(deleteTarget.category, deleteTarget.index)
          }
          closeModal('deleteModal')
        }}
        type={deleteType}
        target={deleteTarget}
        bookmarkCount={
          deleteType === 'category' && deleteTarget
            ? bookmarkData.categories[deleteTarget]?.length || 0
            : 0
        }
      />

      <BookmarkEditModal
        show={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveBookmark}
        currentName={editingBookmark?.bookmark?.siteName || ''}
        currentUrl={editingBookmark?.bookmark?.siteURL || ''}
        categoryName={editingBookmark?.categoryName || ''}
      />

      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </div>
  )
}
