'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Target, MessageSquare, BarChart3, X, LogOut, Zap, Crown, CircleX, User, ChevronDown } from 'lucide-react'
import { supabaseBrowserClient } from '@/src/lib/supabase/client'
import { useCheckout } from '@/src/lib/hooks/use-checkout'
import { Button } from '@/src/lib/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/lib/components/ui/avatar'
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

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: MessageSquare
  },
  {
    name: 'Product',
    href: '/icps',
    icon: Target
  }
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Brand area - mobile only */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src="/file.svg" alt="SubLead" className="w-8 h-8" />
          <span className="text-xl font-bold text-gray-900">SubLead</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 pt-6">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const IconComponent = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group
                ${isActive 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <IconComponent className={`h-5 w-5 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        {loading || (user && isSubscribed === null) ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 outline-none">
              <Avatar className="h-8 w-8 border border-gray-300">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback className="bg-white">
                  <User className="h-4 w-4 text-gray-500" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-700 truncate">{user.user_metadata.name}</span>
                {isSubscribed && (
                  <Badge className="flex items-center gap-1 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-md">
                    <Crown className="h-3 w-3" />
                    <span>Premium</span>
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white z-[80]">
              <div className="px-2 py-1.5 text-sm text-gray-600">{user.email}</div>
              <DropdownMenuSeparator />
              {!isSubscribed && (
                <DropdownMenuItem onClick={() => { handleCheckout(); onClose(); }} disabled={isLoading} className="cursor-pointer bg-white hover:bg-gray-100 focus:bg-gray-100">
                  <Zap className="mr-2 h-4 w-4 text-gray-800" />
                  <span>Upgrade to Premium</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => { handleSignOut(); onClose(); }} className="cursor-pointer bg-white focus:bg-gray-100">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { handleDeleteAccount(); onClose(); }} className="text-red-500 cursor-pointer focus:bg-red-50">
                <CircleX className="mr-2 h-4 w-4" />
                <span>Delete Account</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            asChild
            className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-lg"
          >
            <a href="/auth">Sign In</a>
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <img src="/file.svg" alt="SubLead" className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900">SubLead</span>
          </div>
          <nav className="flex-1 p-4 space-y-1 pt-6">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group
                    ${isActive 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile Section - Desktop */}
          <div className="p-4 border-t border-gray-200">
            {loading || (user && isSubscribed === null) ? (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 outline-none">
                  <Avatar className="h-8 w-8 border border-gray-300">
                    <AvatarImage src={user.user_metadata.avatar_url} />
                    <AvatarFallback className="bg-white">
                      <User className="h-4 w-4 text-gray-500" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700 truncate">{user.user_metadata.name}</span>
                    {isSubscribed && (
                      <Badge className="flex items-center gap-1 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-md">
                        <Crown className="h-3 w-3" />
                        <span>Premium</span>
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white z-[80]">
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
                  <DropdownMenuItem onClick={handleDeleteAccount} className="text-red-500 cursor-pointer focus:bg-red-50">
                    <CircleX className="mr-2 h-4 w-4" />
                    <span>Delete Account</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-lg"
              >
                <a href="/auth">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-[60] md:hidden"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white z-[70] md:hidden shadow-xl">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}