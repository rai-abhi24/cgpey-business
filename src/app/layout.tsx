import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

/**
 * Metadata for SEO
 * Can be dynamic per page
 */
export const metadata: Metadata = {
  title: {
    default: 'CGPEY Business',
    template: '%s | CGPEY Business',
  },
  description: 'Manages payments for your business',
  keywords: ['payments', 'business', 'management'],
  authors: [{ name: 'Abhishek Rai' }],
  creator: 'Abhishek Rai',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://business.cgpey.in',
    title: 'CGPEY Business',
    description: 'Manages payments for your business',
    siteName: 'CGPEY Business',
  },
}

/**
 * Root Layout Component
 *
 * This is the top-level layout that wraps all pages
 * It's a Server Component by default
 *
 * Key points:
 * - Must have <html> and <body> tags
 * - Can fetch data
 * - Shared across all pages
 * - Wrap with providers for client-side features
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserrat.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
