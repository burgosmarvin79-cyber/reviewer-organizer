/** Creates the single Supabase browser client shared by all cloud modules. */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/**
 * The browser client only uses Supabase's publishable key. Database access is
 * protected by Row Level Security, so this key must never be replaced with a
 * secret/service-role key.
 */
export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null

export function requireSupabase() {
  // Centralizing this check gives developers one clear setup error.
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.')
  }
  return supabase
}
