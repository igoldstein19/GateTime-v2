import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'GateTime · Boston Logan',
  description: 'Crowdsourced wait times for BOS — know before you go.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500&family=Cormorant+Garamond:wght@600&family=Josefin+Sans:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F5F6F8] text-[#1A1A2E] pt-16">
        {children}
      </body>
    </html>
  )
}
