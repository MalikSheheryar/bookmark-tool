// File: lib/category-service.ts
import { createClient } from './supabase-client'
import type { Database } from './supabase-client'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

/**
 * Get all categories for a user (both public and private)
 */
export async function getUserCategories(userId: string): Promise<Category[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('category_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    throw error
  }

  return data as Category[]
}

/**
 * Create a new category
 */
export async function createCategory(
  category: CategoryInsert
): Promise<Category> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    throw error
  }

  return data as Category
}

/**
 * Update a category (including public/private status)
 */
export async function updateCategory(
  categoryId: string,
  userId: string,
  updates: CategoryUpdate
): Promise<Category> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    throw error
  }

  return data as Category
}

/**
 * Toggle category public/private status
 */
export async function toggleCategoryVisibility(
  categoryId: string,
  userId: string,
  isPublic: boolean
): Promise<Category> {
  return updateCategory(categoryId, userId, { is_public: isPublic })
}

/**
 * Update category by name (for backward compatibility)
 */
export async function updateCategoryByName(
  userId: string,
  oldName: string,
  newName: string,
  emoji?: string | null,
  isPublic?: boolean
): Promise<void> {
  const supabase = createClient()

  const updates: any = {
    name: newName,
  }

  if (emoji !== undefined) {
    updates.emoji = emoji
  }

  if (isPublic !== undefined) {
    updates.is_public = isPublic
  }

  // Update category
  const { error: categoryError } = await supabase
    .from('categories')
    .update(updates)
    .eq('user_id', userId)
    .eq('name', oldName)

  if (categoryError) {
    console.error('Error updating category:', categoryError)
    throw categoryError
  }

  // If name changed, update bookmarks
  if (oldName !== newName) {
    const { error: bookmarkError } = await supabase
      .from('bookmarks')
      .update({ category_name: newName })
      .eq('user_id', userId)
      .eq('category_name', oldName)

    if (bookmarkError) {
      console.error('Error updating bookmarks:', bookmarkError)
      throw bookmarkError
    }
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(
  categoryId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

/**
 * Delete category by name (for backward compatibility)
 */
export async function deleteCategoryByName(
  userId: string,
  categoryName: string
): Promise<void> {
  const supabase = createClient()

  // Delete bookmarks first
  const { error: bookmarkError } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('category_name', categoryName)

  if (bookmarkError) {
    console.error('Error deleting bookmarks:', bookmarkError)
    throw bookmarkError
  }

  // Delete category
  const { error: categoryError } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', userId)
    .eq('name', categoryName)

  if (categoryError) {
    console.error('Error deleting category:', categoryError)
    throw categoryError
  }
}

/**
 * Get public categories for a user
 */
export async function getPublicCategories(userId: string): Promise<Category[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('category_order', { ascending: true })

  if (error) {
    console.error('Error fetching public categories:', error)
    throw error
  }

  return data as Category[]
}
