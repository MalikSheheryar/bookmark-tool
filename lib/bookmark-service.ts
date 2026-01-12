import { getServerClient } from './supabase-server'
import type { Database } from './supabase-client'

type Bookmark = Database['public']['Tables']['bookmarks']['Row']
type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert']
type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']

export async function getBookmarks(userId: string) {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Bookmark[]
}

export async function addBookmark(bookmark: BookmarkInsert) {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from('bookmarks')
    .insert(bookmark)
    .select()
    .single()

  if (error) throw error
  return data as Bookmark
}

export async function deleteBookmark(bookmarkId: string, userId: string) {
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getCategories(userId: string) {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('category_order', { ascending: true })

  if (error) throw error
  return data as Category[]
}

export async function addCategory(category: CategoryInsert) {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  updates: Database['public']['Tables']['categories']['Update']
) {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function deleteCategory(categoryId: string, userId: string) {
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId)

  if (error) throw error
}
