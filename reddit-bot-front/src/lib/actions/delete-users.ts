'use server'
import { createAdminClient } from '@/src/lib/supabase/server';

export async function deleteCurrentUser(userId: string) {
    const supabase = await createAdminClient()
    
    const { data, error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) {
        return { success: false, error: error.message }
    }
    
    const { error: accountError } = await supabase
        .from('Account')
        .delete()
        .eq('userId', userId)

    if (accountError) {
        return { success: false, error: accountError.message }
    }

    return { success: true, data }
}