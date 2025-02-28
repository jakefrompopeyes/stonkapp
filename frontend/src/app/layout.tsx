import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import Header from '@/components/Header'
import AuthDebug from '@/components/AuthDebug'

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
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="container mx-auto p-4">
            {children}
          </main>
          <AuthDebug />
        </AuthProvider>
      </body>
    </html>
  )
} 