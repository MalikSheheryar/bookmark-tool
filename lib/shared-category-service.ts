// File: lib/shared-category-service.ts
// SENIOR ENGINEER VERSION - Full debugging and bulletproof error handling

import { createClient } from './supabase-client'

export interface SharedCategoryData {
  message_id: string
  share_token: string
  sender_id: string
  recipient_id: string
  category_name: string
  category_emoji: string | null
  is_public_category: boolean
  sender_username: string
  sender_full_name: string | null
  sender_profile_picture: string | null
  note: string | null
  bookmarks: Array<{
    site_name: string
    site_url: string
    created_at: string
  }>
  created_at: string
}

/**
 * Get shared category data by token
 * SENIOR ENGINEER VERSION with comprehensive debugging
 */
export async function getSharedCategoryData(
  token: string
): Promise<SharedCategoryData | null> {
  const supabase = createClient()

  console.log('═══════════════════════════════════════════════════════')
  console.log('🔍 [SHARED CATEGORY] Starting fetch operation')
  console.log('═══════════════════════════════════════════════════════')
  console.log('📋 Input Token:', token)
  console.log('📏 Token Length:', token.length)
  console.log('✓ Valid Format:', isValidShareToken(token))
  console.log('🌐 Supabase Client:', supabase ? 'Initialized' : 'NULL')

  try {
    // ==========================================
    // STEP 1: Test RPC Function
    // ==========================================
    console.log('\n📞 [STEP 1] Calling RPC: get_shared_category_by_token')
    console.log('   Parameters:', { token })

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_shared_category_by_token',
      { token: token }
    )

    console.log('📦 [STEP 1] RPC Response:')
    console.log('   ✓ Has Data:', !!rpcData)
    console.log('   ✓ Is Array:', Array.isArray(rpcData))
    console.log(
      '   ✓ Array Length:',
      Array.isArray(rpcData) ? rpcData.length : 'N/A'
    )
    console.log('   ✓ Error:', rpcError ? rpcError.message : 'None')
    console.log('   📄 Raw Data:', JSON.stringify(rpcData, null, 2))

    if (rpcError) {
      console.error('❌ [STEP 1] RPC Error Details:')
      console.error('   Message:', rpcError.message)
      console.error('   Code:', rpcError.code)
      console.error('   Details:', rpcError.details)
      console.error('   Hint:', rpcError.hint)
      return null
    }

    // ==========================================
    // STEP 2: Parse Response
    // ==========================================
    console.log('\n🔧 [STEP 2] Parsing RPC Response')

    let result = null

    if (!rpcData) {
      console.error('❌ [STEP 2] rpcData is null/undefined')
    } else if (Array.isArray(rpcData)) {
      console.log('   ✓ Data is array')
      if (rpcData.length === 0) {
        console.error('❌ [STEP 2] Array is empty')
      } else {
        result = rpcData[0]
        console.log('   ✓ Extracted first item from array')
        console.log('   📄 Result Keys:', Object.keys(result))
      }
    } else if (typeof rpcData === 'object') {
      console.log('   ✓ Data is object')
      result = rpcData
      console.log('   📄 Result Keys:', Object.keys(result))
    } else {
      console.error('❌ [STEP 2] Unexpected data type:', typeof rpcData)
    }

    // ==========================================
    // STEP 3: Fallback to Direct View Query
    // ==========================================
    if (!result) {
      console.log('\n🔄 [STEP 3] RPC failed, trying direct view query')

      const { data: viewData, error: viewError } = await supabase
        .from('shared_category_view')
        .select('*')
        .eq('share_token', token)
        .single()

      console.log('📦 [STEP 3] View Response:')
      console.log('   ✓ Has Data:', !!viewData)
      console.log('   ✓ Error:', viewError ? viewError.message : 'None')
      console.log('   📄 Raw Data:', JSON.stringify(viewData, null, 2))

      if (viewData) {
        result = viewData
        console.log('   ✅ Retrieved data from view successfully')
      } else {
        console.error('❌ [STEP 3] View query also failed')
      }
    }

    // ==========================================
    // STEP 4: Ultimate Fallback - Manual Join
    // ==========================================
    if (!result) {
      console.log('\n🆘 [STEP 4] Both methods failed, trying manual join')

      // First get the message
      const { data: message, error: msgError } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('share_token', token)
        .single()

      console.log('📨 [STEP 4] Message Query:')
      console.log('   ✓ Has Data:', !!message)
      console.log('   ✓ Error:', msgError ? msgError.message : 'None')
      console.log('   📄 Message:', JSON.stringify(message, null, 2))

      if (message) {
        // Get sender info
        const { data: sender } = await supabase
          .from('users')
          .select('username, full_name, profile_picture_url')
          .eq('id', message.sender_id)
          .single()

        console.log('👤 [STEP 4] Sender Query:', sender)

        // Get category info
        const { data: category } = await supabase
          .from('categories')
          .select('emoji, is_public')
          .eq('user_id', message.sender_id)
          .eq('name', message.category_name)
          .single()

        console.log('📁 [STEP 4] Category Query:', category)

        // Get bookmarks
        const { data: bookmarks } = await supabase
          .from('bookmarks')
          .select('site_name, site_url, created_at')
          .eq('user_id', message.sender_id)
          .eq('category_name', message.category_name)
          .order('created_at', { ascending: false })

        console.log('🔖 [STEP 4] Bookmarks Query:', bookmarks)

        // Manually construct result
        result = {
          message_id: message.id,
          share_token: message.share_token,
          sender_id: message.sender_id,
          recipient_id: message.recipient_id,
          category_name: message.category_name,
          category_emoji: category?.emoji || '📁',
          is_public_category: category?.is_public || false,
          sender_username: sender?.username || 'Unknown',
          sender_full_name: sender?.full_name,
          sender_profile_picture: sender?.profile_picture_url,
          note: message.note,
          bookmarks: bookmarks || [],
          created_at: message.created_at,
        }

        console.log('   ✅ Manually constructed result successfully')
      } else {
        console.error('❌ [STEP 4] Token not found in inbox_messages table')
        console.error(
          '   🔍 This means the share token does not exist in the database'
        )
        return null
      }
    }

    // ==========================================
    // STEP 5: Validate Result
    // ==========================================
    if (!result) {
      console.error('❌ [STEP 5] All fetch methods failed')
      console.error('   Token:', token)
      console.error('   Recommendation: Check if token exists in database')
      return null
    }

    console.log('\n✅ [STEP 5] Got result object')
    console.log('   Fields present:', Object.keys(result))
    console.log('   Required fields check:')
    console.log('   ✓ message_id:', !!result.message_id)
    console.log('   ✓ share_token:', !!result.share_token)
    console.log('   ✓ sender_id:', !!result.sender_id)
    console.log('   ✓ category_name:', !!result.category_name)
    console.log('   ✓ sender_username:', !!result.sender_username)

    // ==========================================
    // STEP 6: Parse Bookmarks
    // ==========================================
    console.log('\n📚 [STEP 6] Processing bookmarks')
    let bookmarks = result.bookmarks

    console.log('   Raw bookmarks type:', typeof bookmarks)
    console.log('   Raw bookmarks value:', bookmarks)

    if (typeof bookmarks === 'string') {
      try {
        bookmarks = JSON.parse(bookmarks)
        console.log('   ✅ Parsed bookmarks from JSON string')
      } catch (e) {
        console.error('   ❌ Failed to parse bookmarks JSON:', e)
        bookmarks = []
      }
    }

    if (!Array.isArray(bookmarks)) {
      console.warn('   ⚠️  Bookmarks not an array, converting to array')
      bookmarks = []
    }

    console.log('   ✅ Final bookmarks count:', bookmarks.length)

    // ==========================================
    // STEP 7: Build Final Object
    // ==========================================
    console.log('\n🏗️  [STEP 7] Building final SharedCategoryData object')

    const finalData: SharedCategoryData = {
      message_id: result.message_id,
      share_token: result.share_token,
      sender_id: result.sender_id,
      recipient_id: result.recipient_id,
      category_name: result.category_name,
      category_emoji: result.category_emoji || '📁',
      is_public_category: result.is_public_category || false,
      sender_username: result.sender_username,
      sender_full_name: result.sender_full_name,
      sender_profile_picture: result.sender_profile_picture,
      note: result.note,
      bookmarks: bookmarks,
      created_at: result.created_at,
    }

    console.log('\n🎉 [SUCCESS] Final data prepared:')
    console.log('   Category:', finalData.category_name)
    console.log('   Emoji:', finalData.category_emoji)
    console.log('   Sender:', finalData.sender_username)
    console.log('   Bookmarks:', finalData.bookmarks.length)
    console.log('   Note:', finalData.note ? 'Yes' : 'No')
    console.log('   Public:', finalData.is_public_category)
    console.log('═══════════════════════════════════════════════════════')
    console.log('✅ Fetch operation completed successfully')
    console.log('═══════════════════════════════════════════════════════')

    return finalData
  } catch (error) {
    console.error('\n💥 [CRITICAL ERROR] Unexpected exception:')
    console.error('   Error Type:', error?.constructor?.name)
    console.error(
      '   Error Message:',
      error instanceof Error ? error.message : String(error)
    )
    console.error(
      '   Stack Trace:',
      error instanceof Error ? error.stack : 'N/A'
    )
    console.log('═══════════════════════════════════════════════════════')
    return null
  }
}

/**
 * Generate a unique share token
 */
export function generateShareToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 10) // 8 chars
  const timestampPart = Date.now().toString(36).slice(-6) // 6 chars
  const token = randomPart + timestampPart

  console.log('🎲 Generated new share token:', token)
  return token
}

/**
 * Validate share token format
 */
export function isValidShareToken(token: string): boolean {
  const isValid = /^[a-z0-9]{14,20}$/i.test(token)
  if (!isValid) {
    console.warn('⚠️  Invalid token format:', token)
  }
  return isValid
}

/**
 * Debug function - comprehensive token analysis
 */
export async function debugShareToken(token: string): Promise<void> {
  const supabase = createClient()

  console.group('🔧═══ DEBUG: Share Token Analysis ═══')
  console.log('Token:', token)
  console.log('Token Length:', token.length)
  console.log('Valid Format:', isValidShareToken(token))

  // Test 1: inbox_messages table
  console.log('\n📋 Test 1: inbox_messages table')
  const { data: message, error: msgError } = await supabase
    .from('inbox_messages')
    .select('*')
    .eq('share_token', token)
    .single()
  console.log('Result:', message ? 'FOUND' : 'NOT FOUND')
  console.log('Data:', message)
  console.log('Error:', msgError?.message || 'None')

  // Test 2: shared_category_view
  console.log('\n📋 Test 2: shared_category_view')
  const { data: viewData, error: viewError } = await supabase
    .from('shared_category_view')
    .select('*')
    .eq('share_token', token)
    .single()
  console.log('Result:', viewData ? 'FOUND' : 'NOT FOUND')
  console.log('Data:', viewData)
  console.log('Error:', viewError?.message || 'None')

  // Test 3: RPC function
  console.log('\n📋 Test 3: get_shared_category_by_token RPC')
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_shared_category_by_token',
    { token }
  )
  console.log('Result:', rpcData ? 'FOUND' : 'NOT FOUND')
  console.log('Data:', rpcData)
  console.log('Error:', rpcError?.message || 'None')

  // Test 4: Related data
  if (message) {
    console.log('\n📋 Test 4: Related Data')

    const { data: sender } = await supabase
      .from('users')
      .select('*')
      .eq('id', message.sender_id)
      .single()
    console.log('Sender:', sender ? 'FOUND' : 'NOT FOUND', sender)

    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', message.sender_id)
      .eq('name', message.category_name)
      .single()
    console.log('Category:', category ? 'FOUND' : 'NOT FOUND', category)

    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', message.sender_id)
      .eq('category_name', message.category_name)
    console.log(
      'Bookmarks:',
      bookmarks ? `FOUND (${bookmarks.length})` : 'NOT FOUND',
      bookmarks
    )
  }

  console.log('═══════════════════════════════════')
  console.groupEnd()
}
