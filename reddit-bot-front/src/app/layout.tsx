import type { Metadata } from 'next'
import '@/src/globals.css'
import { PostHogProvider } from '@/src/lib/providers'
import ThemeWrapper from '@/src/lib/components/theme-wrapper'
import { Navbar } from '../lib/components/navbar'

export const metadata: Metadata = {
  title: 'dashboard template',
  description: 'orange',
  openGraph: {
    images: [
      {
        url: 'https://tenor.com/view/cigar-smoke-funny-gif-25177516',
        width: 1200,
        height: 630,
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className='font-primary'>
        <PostHogProvider>
          <ThemeWrapper>
            <Navbar/>
            {children}
          </ThemeWrapper>
        </PostHogProvider>
      </body>
    </html>
  )
}
