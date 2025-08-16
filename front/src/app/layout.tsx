import type { Metadata } from 'next'
import '@/src/globals.css'
import { PostHogProvider } from '@/src/lib/providers'
import dynamic from 'next/dynamic'

import { Navbar } from '@/src/lib/features/global/navbar'

const CrispWithNoSSR = dynamic(
  () => import('@/src/lib/components/crisp')
)

export const metadata: Metadata = {
  title: 'SubLead',
  description: 'SubLead - AI Agent for Reddit Lead Generation',
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
            <CrispWithNoSSR />
            <Navbar/>
            {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
