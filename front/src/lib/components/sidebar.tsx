'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Target, MessageSquare, BarChart3, X } from 'lucide-react'

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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Brand area - mobile only */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src="/file.svg" alt="Sublead" className="w-8 h-8" />
          <span className="text-xl font-bold text-gray-900">Sublead</span>
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
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <img src="/file.svg" alt="Sublead" className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900">Sublead</span>
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