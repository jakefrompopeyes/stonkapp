import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import Header from '@/components/Header'
import AuthDebug from '@/components/AuthDebug'
import ViewCounter from '@/components/ViewCounter'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StonkApp',
  description: 'Track and manage your investments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // On page load or when changing themes, best to add inline in \`head\` to avoid FOUC
            if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          `
        }} />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 min-h-screen`}>
        <AuthProvider>
          <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">StonkApp</span>
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <ViewCounter />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          
          <AuthDebug />
        </AuthProvider>
      </body>
    </html>
  )
} 