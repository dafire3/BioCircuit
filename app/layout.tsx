import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BioCircuit',
  description: 'Archaeology tool concept demo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}


