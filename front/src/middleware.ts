import { NextRequest } from 'next/server'
import { updateSession } from '@/src/lib/services/supabase/middleware'

export async function middleware(request: NextRequest) {
   return await updateSession(request)
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/icps/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|auth).*)',
    ],
}