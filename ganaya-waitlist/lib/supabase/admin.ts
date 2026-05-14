import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('admin client must never run in the browser')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}
