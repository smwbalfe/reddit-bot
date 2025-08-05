"use client"

import SubLeadLogo from '@/src/public/file.svg'

export const Navbar = () => {

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between w-full px-4 sm:px-6 py-3">
                <div className="flex items-center">
                    <div className="flex items-center gap-2">
                        <img src="/file.svg" alt="Logo" className="h-8 w-8" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">SubLead</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* User profile moved to sidebar */}
                </div>
            </div>
        </nav>
    )
}