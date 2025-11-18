import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundaryWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EdTech Payment Platform',
  description: 'Comprehensive platform for student onboarding, mentor assignment, and payment management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundaryWrapper>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}
