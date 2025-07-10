"use client"

import { supabaseBrowserClient } from '@/src/lib/supabase/client'
import { useCheckout } from '@/src/lib/hooks/use-checkout'
import { Button } from '@/src/lib/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/lib/components/ui/avatar'
import { LogOut, Zap, Crown, CircleX, User, Router } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/src/lib/components/ui/badge'
import { deleteCurrentUser } from '../actions/delete-users'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/src/lib/components/ui/dropdown-menu'
import { checkSubscription } from '../actions/check-subscription'
import { useUser } from '@/src/lib/features/auth/hooks/use-user'

export const Navbar = () => {

    const appName = "RedditBot"

    const { user, loading } = useUser()
    const { handleCheckout, isLoading } = useCheckout(user?.id)
    const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null)

    useEffect(() => {
        if (user) {
            checkSubscription().then((data) => {
                setIsSubscribed(data.isSubscribed)
            })
        }
    }, [user])

    const handleSignOut = async () => {
        await supabaseBrowserClient.auth.signOut()
    }

    const handleDeleteAccount = async () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            await deleteCurrentUser(user?.id!)
            await supabaseBrowserClient.auth.signOut()
        }
    }

    if (loading || (user && isSubscribed === null)) {
        return (
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="font-bold text-xl text-gray-800">{appName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-md"></div>
                    </div>
                </div>
            </nav>
        )
    }

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <span className="font-bold text-xl text-gray-800">{appName}</span>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border border-gray-300">
                                        <AvatarImage src={user.user_metadata.avatar_url} />
                                        <AvatarFallback className="bg-white">
                                            <User className="h-4 w-4 text-gray-500" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-700">{user.user_metadata.name}</span>
                                    {isSubscribed && (
                                        <Badge className="flex items-center gap-1 bg-gray-700 text-white rounded-normal">
                                            <Crown className="h-3 w-3" />
                                            Premium
                                        </Badge>
                                    )}
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-white">
                                <div className="px-2 py-1.5 text-sm text-gray-600">{user.email}</div>
                                <DropdownMenuSeparator />
                                {!isSubscribed && (
                                    <DropdownMenuItem onClick={handleCheckout} disabled={isLoading} className="cursor-pointer bg-white hover:bg-gray-100 focus:bg-gray-100">
                                        <Zap className="mr-2 h-4 w-4 text-gray-800" />
                                        <span>Upgrade to Premium</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer bg-white focus:bg-gray-100">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign Out</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDeleteAccount} className="text-red-500 cursor-pointer focus:bg-red-50 focus: ">
                                    <CircleX className="mr-2 h-4 w-4" />
                                    <span>Delete Account</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            asChild
                            className="bg-gray-800 hover:bg-gray-900 text-white rounded-normal shadow-primary"
                        >
                            <a href="/auth">Sign In</a>
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    )
}