import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Silly Sanrio Gacha',
  description: "dont sue me",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
