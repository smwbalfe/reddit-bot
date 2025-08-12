'use client'

import Sidebar from '@/src/lib/features/global/sidebar'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import type { DashboardLayoutProps } from '@/src/lib/features/dashboard/types'

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname === '/leads') return 'Leads'
    if (pathname === '/icps') return 'Product'
    if (pathname.startsWith('/leads/')) return 'Lead Details'
    return 'SubLead'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
          <Image src="/file.svg" alt="SubLead" width={32} height={32} className="w-8 h-8" priority />
          <span className="text-xl font-bold text-gray-900">{getPageTitle()}</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="hidden md:block bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-64 right-0 z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 md:ml-64 pt-16 md:pt-20">
          {children}
        </main>
      </div>
    </div>
  )
}