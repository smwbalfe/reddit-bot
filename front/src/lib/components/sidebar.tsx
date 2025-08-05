'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Target, MessageSquare, BarChart3, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useIsMobile } from '../hooks/use-mobile'

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
    name: 'Products',
    href: '/icps',
    icon: Target
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])

  if (isMobile) {
    return (
      <>
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-md shadow-sm md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 md:hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6">
                <nav className="space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href
                    const IconComponent = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <IconComponent className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const IconComponent = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <IconComponent className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}