import { createClient } from '@supabase/supabase-js'

const clean = (val) => (val || '').trim()

const url = clean(import.meta.env.VITE_SUPABASE_URL)
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY)

try {
  // Validate presence and URL shape
  if (!url || !anonKey) {
    throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  }
  new URL(url)
} catch (err) {
  console.error('Supabase client misconfigured:', err?.message)
  throw err
}

export const supabase = createClient(url, anonKey)
