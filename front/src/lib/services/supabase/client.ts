import { createBrowserClient } from '@supabase/ssr'
import env from '@/src/lib/env'

function createClient() {
    return createBrowserClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_KEY
    )
}

export const supabaseBrowserClient = createClient()