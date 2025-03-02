import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FeedbackButton from '@/components/FeedbackButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StonkScan',
  description: 'Track and manage your investments',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: { url: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
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
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="container mx-auto p-4 flex-grow">
              {children}
            </main>
            <Footer />
            <FeedbackButton />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
} 