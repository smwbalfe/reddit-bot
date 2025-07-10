import { NextResponse } from 'next/server'
import { makeServerClient } from '@/src/lib/supabase/server'
import { createOrUpdateUserAccount } from '@/src/lib/actions/create-user'
import env from '@/src/lib/env'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    console.log('Auth callback route called')
    console.log('Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key present:', !!env.NEXT_PUBLIC_SUPABASE_KEY)
    console.log('Full URL:', request.url)
    console.log('All search params:', Object.fromEntries(searchParams.entries()))
    
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    
    console.log('Auth callback parameters:', { code: code ? 'present' : 'missing', next })
    
    if (code) {
        console.log('Code found, attempting to exchange for session')
        const supabase = await makeServerClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            console.log('Session exchange successful, user ID:', data.user.id)
            try {
                console.log('Creating/updating user account for ID:', data.user.id)
                await createOrUpdateUserAccount(data.user.id)
                console.log('User account creation/update successful')
            } catch (e) {
                console.error('Error creating user account:', e)
            }
            console.log('Redirecting to:', `${env.NEXT_PUBLIC_APP_URL}${next}`)
            return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}${next}`)
        } else {
            console.error('Session exchange failed:', error)
        }
    } else {
        console.log('No code provided in callback')
    }

    console.log('Redirecting to auth error page')
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/auth/auth-code-error`)
}