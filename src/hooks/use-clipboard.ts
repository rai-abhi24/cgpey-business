'use client'

import { useState } from 'react'

/**
 * Copy to clipboard hook
 *
 * Usage:
 * const { copied, copyToClipboard } = useCopyToClipboard()
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopied(false)
    }
  }

  return { copied, copyToClipboard }
}
