import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase = null

// NEVER remove the function below. It keeps a live reference to `supabase`
// so bundlers cannot dead-code-eliminate the createClient(...) call when the
// NEXT_PUBLIC_* env vars are missing (which silently breaks every page with
// "Cannot read properties of null (reading 'auth')" in production).
export function isSupabaseConfigured() {
  return supabase !== null
}

// Create the client whenever the keys exist (browser or server).
// If the keys are missing, `supabase` stays null and every page that
// depends on Supabase degrades gracefully instead of crashing during hydration.
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: typeof window !== 'undefined',
      persistSession: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
    },
  })
}

if (typeof window !== 'undefined' && !supabase) {
  // Not stripped: next.config.mjs removeConsole only removes console.* calls,
  // this flag lets the UI-gated flow know auth is unavailable.
  window.__SUPABASE_MISSING_ENV__ = true
}

export { supabase }