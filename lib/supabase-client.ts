import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        // Let Supabase auto-detect and exchange the code
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  )

  return browserClient
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string
          email: string
          username: string | null
          full_name: string | null
          bio: string | null
          profile_picture_url: string | null
          instagram_url: string | null
          twitter_url: string | null
          other_link: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['users']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          site_name: string
          site_url: string
          category_name: string
          category_emoji: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['bookmarks']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['bookmarks']['Row']>
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          emoji: string | null
          category_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['categories']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['categories']['Row']>
      }
    }
  }
}
