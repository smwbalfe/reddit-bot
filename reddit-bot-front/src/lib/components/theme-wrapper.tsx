'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  const toggleTheme = () => {
    console.log('toggleTheme', theme)
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <>
      {children}
      <button
        className="fixed bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-blue-600 dark:bg-blue-500 dark:text-gray-900 dark:hover:bg-blue-400"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    </>
  )
} 