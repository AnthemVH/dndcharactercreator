import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client (service role). Never expose the service key to the browser!
const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY) as string

if (!supabaseUrl) {
  console.error('SUPABASE_URL is not set. Please create a .env.local file with your Supabase configuration.')
}
if (!supabaseServiceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is not set. Please create a .env.local file with your Supabase configuration.')
}

export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceRoleKey || '', {
  auth: { persistSession: false },
})

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceRoleKey)


