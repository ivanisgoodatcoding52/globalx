import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Message = {
  id: string
  user_id: string
  username: string
  content?: string
  file_url?: string
  file_name?: string
  file_type?: string
  file_size?: number
  created_at: string
}

export type User = {
  id: string
  username: string
  created_at: string
  last_seen: string
}

export type TypingIndicator = {
  id: string
  user_id: string
  username: string
  is_typing: boolean
  updated_at: string
}
