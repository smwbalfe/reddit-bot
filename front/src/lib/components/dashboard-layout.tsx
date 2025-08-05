'use client'

import Sidebar from './sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-50 md:ml-0">
        {children}
      </main>
    </div>
  )
}