import { createClient, type SupabaseClient } from '@supabase/supabase-js'
// import { SUPABASE_APP_ID } from '@utils/constants'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Initialize Supabase client
let supabase: SupabaseClient | null = null

const initializeSupabase = (): void => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration not found. Using local storage fallback.')
    console.warn('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
    return
  }

  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    console.log('Supabase initialized successfully')
  } catch (error) {
    console.error('Error initializing Supabase:', error)
  }
}

// Initialize on import
initializeSupabase()

export { supabase }
export const isSupabaseAvailable = (): boolean => supabase !== null

// Database type definitions (can be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          current_stage: number
          stages: any // JSONB
          metadata: any // JSONB
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          current_stage?: number
          stages?: any
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          current_stage?: number
          stages?: any
          metadata?: any
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          claude_api_key: string | null
          n8n_api_key: string | null
          n8n_base_url: string | null
          theme: string
          notifications: boolean
          save_progress: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          claude_api_key?: string | null
          n8n_api_key?: string | null
          n8n_base_url?: string | null
          theme?: string
          notifications?: boolean
          save_progress?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          claude_api_key?: string | null
          n8n_api_key?: string | null
          n8n_base_url?: string | null
          theme?: string
          notifications?: boolean
          save_progress?: boolean
          updated_at?: string
        }
      }
    }
  }
}
