"use client"
import { useState } from 'react'
import { supabaseBrowserClient } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/lib/components/ui/button'
import { Input } from '@/src/lib/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/lib/components/ui/card'
import { AuthAlert } from './components'

export const PasswordReset = () => {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isError, setIsError] = useState(false)

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabaseBrowserClient.auth.updateUser({ password })
            if (error) throw error
            setMessage('Password updated successfully!')
            setIsError(false)
            await supabaseBrowserClient.auth.signOut()
            router.push('/auth')
            setPassword('')
        } catch (err: any) {
            setMessage(err.message)
            setIsError(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>Enter your new password below</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full"
                            />
                        </div>
                        {message && <AuthAlert message={message} type={isError ? "error" : "success"} />}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
