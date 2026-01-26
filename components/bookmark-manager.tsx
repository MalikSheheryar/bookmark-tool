'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { BookmarkForm } from '@/components/bookmark-form'
import { CategorySection } from '@/components/category-section'
import { ErrorModal } from '@/components/error-modal'
import { CategoryModal } from '@/components/category-modal'
import { ShareModal } from '@/components/share-modal'
import { DeleteModal } from '@/components/delete-modal'
import { Toast } from '@/components/toast'
import { useBookmarkManagerHybrid } from '@/hooks/use-bookmark-manager-hybrid'
import '@/styles/bookmark-manager.css'

export default function BookmarkManager() {
  const { dbUser, isLoading: authLoading } = useAuth()

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
    toggleCategory,
    startEditingCategory,
    shareCategory,
    reorderCategories,
    setSelectedEmoji,
    toggleCategoryVisibility, // ← ADD THIS LINE
    getPrivateCategoryCount, // NEW: Import this
  } = useBookmarkManagerHybrid({
    userId: dbUser?.id,
    onSyncBookmark: dbUser?.id
      ? async (bookmark) => {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()

          try {
            console.log('💾 Inserting bookmark into database:', bookmark)

            const { data, error } = await supabase
              .from('bookmarks')
              .insert({
                user_id: bookmark.user_id,
                site_name: bookmark.site_name,
                site_url: bookmark.site_url,
                category_name: bookmark.category_name,
              })
              .select()

            if (error) {
              console.error('❌ Supabase error:', error)
              throw error
            }

            console.log('✅ Bookmark inserted successfully:', data)
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
            console.log('💾 Inserting category into database:', category)

            // Check if category already exists
            const { data: existingCategory } = await supabase
              .from('categories')
              .select('id')
              .eq('user_id', category.user_id)
              .eq('name', category.name)
              .maybeSingle()

            if (existingCategory) {
              console.log('⚠️ Category already exists, skipping insert')
              throw new Error('Category already exists')
            }

            const { data, error } = await supabase
              .from('categories')
              .insert({
                user_id: category.user_id,
                name: category.name,
                emoji: category.emoji,
                category_order: category.category_order,
              })
              .select()

            if (error) {
              console.error('❌ Supabase error:', error)
              throw error
            }

            console.log('✅ Category inserted successfully:', data)
          } catch (error) {
            console.error('❌ Error syncing category:', error)
            throw error
          }
        }
      : undefined,
    onUpdateCategory: dbUser?.id
      ? async (oldName, newName, emoji) => {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()

          try {
            console.log('🔄 Updating category in database:', {
              user_id: dbUser.id,
              old_name: oldName,
              new_name: newName,
              emoji,
            })

            const { error: categoryError } = await supabase
              .from('categories')
              .update({
                name: newName,
                emoji: emoji,
              })
              .eq('user_id', dbUser.id)
              .eq('name', oldName)

            if (categoryError) {
              console.error(
                '❌ Supabase error updating category:',
                categoryError,
              )
              throw categoryError
            }

            if (oldName !== newName) {
              const { error: bookmarkError } = await supabase
                .from('bookmarks')
                .update({
                  category_name: newName,
                })
                .eq('user_id', dbUser.id)
                .eq('category_name', oldName)

              if (bookmarkError) {
                console.error(
                  '❌ Supabase error updating bookmarks:',
                  bookmarkError,
                )
                throw bookmarkError
              }
            }

            console.log('✅ Category updated successfully in database')
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

            console.log('🗑️ Deleting bookmark from database:', {
              user_id: dbUser.id,
              site_name: bookmark.siteName,
              category_name: categoryName,
            })

            const { error } = await supabase
              .from('bookmarks')
              .delete()
              .eq('user_id', dbUser.id)
              .eq('site_name', bookmark.siteName)
              .eq('category_name', categoryName)

            if (error) {
              console.error('❌ Supabase error:', error)
              throw error
            }

            console.log('✅ Bookmark deleted successfully from database')
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
            console.log('🗑️ Deleting category and bookmarks from database:', {
              user_id: dbUser.id,
              category_name: categoryName,
            })

            const { error: bookmarkError } = await supabase
              .from('bookmarks')
              .delete()
              .eq('user_id', dbUser.id)
              .eq('category_name', categoryName)

            if (bookmarkError) {
              console.error(
                '❌ Supabase error deleting bookmarks:',
                bookmarkError,
              )
              throw bookmarkError
            }

            const { error: categoryError } = await supabase
              .from('categories')
              .delete()
              .eq('user_id', dbUser.id)
              .eq('name', categoryName)

            if (categoryError) {
              console.error(
                '❌ Supabase error deleting category:',
                categoryError,
              )
              throw categoryError
            }

            console.log(
              '✅ Category and bookmarks deleted successfully from database',
            )
          } catch (error) {
            console.error('❌ Error deleting category:', error)
            throw error
          }
        }
      : undefined,
  })

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        addBookmark({ name: '', url: '', category: '' })
      }

      if (e.key === 'Escape') {
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
  }, [modals, closeModal, showModal, addBookmark])

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
    <div className="bookmark-manager">
      <header className="bookmark-header">
        <div className="header-container">
          <h1>Bookmarks</h1>
          <p>
            <i className="fa-regular fa-bookmark"></i>
            Organize your favorite sites
            <i className="fa-regular fa-bookmark"></i>
          </p>
        </div>
      </header>


      <main className="main-wrapper">
        <div className="main-container">
          <BookmarkForm
            categories={Object.keys(bookmarkData.categories)}
            onSubmit={addBookmark}
            bookmarkData={bookmarkData}
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
            onToggleVisibility={toggleCategoryVisibility} // ADD THIS LINE
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
        currentPrivateCategoryCount={getPrivateCategoryCount()} // NEW: Add this prop
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

      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </div>
  )
}
