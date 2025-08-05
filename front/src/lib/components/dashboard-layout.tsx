'use client'

import Sidebar from './sidebar'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard'
      case '/leads':
        return 'Leads'
      case '/icps':
        return 'Product'
      default:
        return 'SubLead'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/file.svg" alt="SubLead" className="w-8 h-8" />
          <span className="text-xl font-bold text-gray-900">{getPageTitle()}</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 md:ml-64 pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}