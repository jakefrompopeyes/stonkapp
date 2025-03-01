import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import Header from '@/components/Header'
import FeedbackButton from '@/components/FeedbackButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StonkScan',
  description: 'Track and manage your investments',
  icons: {
    icon: '/favicon.ico',
    apple: '/images/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="container mx-auto p-4">
            {children}
          </main>
          <FeedbackButton />
        </AuthProvider>
      </body>
    </html>
  )
} 