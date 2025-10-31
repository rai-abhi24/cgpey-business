'use client'

/**
 * Hook to get current user data
 *
 * Usage:
 * const { user, isLoading, isAuthenticated } = useUser()
 */
export function useUser() {
  // const { data: session, status } = useSession()

  const { data: session, status } = {} as any;

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
  }
}
