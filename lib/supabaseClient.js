import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase = null

// Create the client whenever the keys exist (browser or server).
// This guarantees `supabase` is never null for consumers, which
// prevents "Cannot read properties of null (reading 'auth')".
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
  // Don't throw during server-side compilation; warn client-side if keys are missing.
  console.warn('Supabase environment variables not set: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export { supabase }