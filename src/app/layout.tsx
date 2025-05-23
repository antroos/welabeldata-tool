import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { StorageProvider } from '../contexts/StorageContext'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Chat LLM',
  description: 'Chat with AI language models',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <StorageProvider>
          <main className="bg-gray-50 text-gray-900 min-h-screen">
            {children}
          </main>
        </StorageProvider>
      </body>
    </html>
  )
}
