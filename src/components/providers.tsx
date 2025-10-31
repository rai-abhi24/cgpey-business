'use client'

/**
 * Providers Component
 *
 * All client-side providers (Context, State management, etc.)
 * must be wrapped in a Client Component
 *
 * Why separate file?
 * - Keeps layout.tsx as Server Component
 * - Only this component and its children are Client Components
 * - Better performance and bundle size
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  /**
   * Create QueryClient inside component to avoid sharing between requests
   * Each user gets their own QueryClient instance
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Data stays fresh for 1 minute
            refetchOnWindowFocus: false, // Don't refetch on window focus
            retry: 1, // Retry failed requests once
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
      >
        {children}

        {/* React Query Devtools - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </ThemeProvider>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
