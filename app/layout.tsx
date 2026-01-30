import type React from 'react'
import { Tektur } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { Navbar } from '@/components/navbar'

const tektur = Tektur({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-tektur',
})

export const metadata = {
  title: 'Link Manager',
  description:
    'organise your favorite sites with categories and drag-and-drop functionality',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={tektur.variable}>
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className={`${tektur.className} antialiased`}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
