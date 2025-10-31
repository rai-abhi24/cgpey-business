'use client'

import { useEffect, useState } from 'react'

/**
 * Debounce hook
 *
 * Delays updating a value until after a specified delay
 * Useful for search inputs to avoid excessive API calls
 *
 * Usage:
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 500)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
