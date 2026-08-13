import { useEffect } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Keeps Tab focus inside an open overlay, closes it on Escape, and restores
 * focus to whatever was focused before it opened.
 */
export function useFocusTrap(ref, active, onClose) {
  useEffect(() => {
    if (!active) return

    const node = ref.current
    if (!node) return

    const previouslyFocused = document.activeElement

    // Move focus in, preferring the first real control.
    const initial = node.querySelector(FOCUSABLE)
    ;(initial ?? node).focus?.()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return

      const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )
      if (!items.length) return

      const first = items[0]
      const last = items[items.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)

      // Restore focus only if nothing else has claimed it. A caller that closes
      // the overlay and deliberately focuses something else — picking a category
      // and landing in the search field, say — would otherwise be overruled by
      // this cleanup, which runs after their .focus() call.
      const active = document.activeElement
      const focusEscaped = active && active !== document.body && !node.contains(active)
      if (!focusEscaped) previouslyFocused?.focus?.()
    }
  }, [ref, active, onClose])
}
