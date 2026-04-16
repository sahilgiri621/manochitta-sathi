import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from "@/components/providers/auth-provider"
import { ChatbotWidget } from "@/components/chatbot-widget"
import './globals.css'

export const metadata: Metadata = {
  title: 'Mannochitta Sathi - Mental Wellbeing Platform',
  description: 'Nepal\'s largest online therapy platform. Connect with qualified therapists for mental health support through messaging, audio, and video sessions.',
  keywords: ['mental health', 'therapy', 'counseling', 'Nepal', 'online therapy', 'therapist'],
  icons: {
    icon: '/images/MS%20app%20icon%20Logo.png',
    apple: '/images/MS%20app%20icon%20Logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#166534',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <ChatbotWidget />
          <Toaster position="top-right" />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
