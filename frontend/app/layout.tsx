import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BioScience RAG - AI Research Assistant',
  description: 'Advanced AI chatbot for biological science research queries',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
