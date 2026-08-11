import { useEffect } from 'react'

/**
 * Freezes background scrolling while an overlay is open.
 *
 * Padding compensates for the removed scrollbar so the fixed header doesn't
 * shift sideways when the lock engages.
 */
export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return

    const { body } = document
    const prevOverflow = body.style.overflow
    const prevPadding = body.style.paddingRight
    const gap = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${gap}px`

    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPadding
    }
  }, [locked])
}
