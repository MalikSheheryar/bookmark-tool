// File: app/test-share/page.tsx
// TEMPORARY DIAGNOSTIC PAGE - Remove after fixing
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { debugShareToken } from '@/lib/shared-category-service'

export default function TestSharePage() {
  const [token, setToken] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    if (!token.trim()) {
      alert('Please enter a share token')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const supabase = createClient()

      console.log('🧪 Running comprehensive test for token:', token)

      // Test 1: Check inbox_messages table
      const { data: message, error: msgError } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('share_token', token)
        .single()

      // Test 2: Check shared_category_view
      const { data: viewData, error: viewError } = await supabase
        .from('shared_category_view')
        .select('*')
        .eq('share_token', token)
        .single()

      // Test 3: Call RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_shared_category_by_token',
        { token }
      )

      // Test 4: If message exists, get related data
      let sender = null
      let category = null
      let bookmarks = null

      if (message) {
        const { data: s } = await supabase
          .from('users')
          .select('*')
          .eq('id', message.sender_id)
          .single()
        sender = s

        const { data: c } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', message.sender_id)
          .eq('name', message.category_name)
          .single()
        category = c

        const { data: b } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', message.sender_id)
          .eq('category_name', message.category_name)
        bookmarks = b
      }

      setResults({
        message: { data: message, error: msgError?.message },
        viewData: { data: viewData, error: viewError?.message },
        rpcData: { data: rpcData, error: rpcError?.message },
        sender,
        category,
        bookmarks,
      })

      // Also run the debug function
      await debugShareToken(token)
    } catch (error) {
      console.error('Test error:', error)
      setResults({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const getAllTokens = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('inbox_messages')
        .select('share_token, category_name, created_at')
        .not('share_token', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)

      setResults({ allTokens: data })
    } catch (error) {
      console.error('Error fetching tokens:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            🔧 Share Token Diagnostic Tool
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Token to Test
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter share token (e.g., 5rtjnorjcnmmfm)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={runTest}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Run Test'}
              </button>
            </div>
          </div>

          <button
            onClick={getAllTokens}
            disabled={loading}
            className="mb-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Get All Share Tokens
          </button>

          {results && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Test Results:</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-xs max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">📋 Instructions:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Click "Get All Share Tokens" to see available tokens</li>
              <li>2. Copy a token and paste it in the input above</li>
              <li>3. Click "Run Test" to diagnose the issue</li>
              <li>4. Check browser console for detailed logs</li>
              <li>
                5. Look for missing data in sender, category, or bookmarks
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
