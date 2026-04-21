import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load .env from the server directory first, then fall back to parent
dotenv.config()

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY

if (!url || !serviceKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_KEY is missing from environment variables')
}

// IMPORTANT: Use service key so server bypasses RLS entirely.
// The service key must start with eyJ... (JWT), NOT sb_publishable_...
// Get it from: Supabase Dashboard → Settings → API → service_role (secret)
export const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

console.log('✅ Supabase client initialised for', url)
