import { useEffect } from 'react'
import { useStudio, useStudioActions } from './StudioProvider'

/** Typing in a field must never trigger a tool shortcut. */
function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/**
 * The studio's shortcut map, scoped to the studio.
 *
 * This matters now that the editor lives on a landing page rather than behind a
 * full-screen overlay. A window-wide binding would mean `c`, `r`, `f` or `0`
 * fired editor commands while somebody was simply reading the collections grid,
 * and `⌘Z` would be hijacked across the entire page.
 *
 * So the rule is: shortcuts are live only while the studio is full screen, or
 * while focus is somewhere inside the studio section. Clicking the stage focuses
 * it, so they come alive exactly when you would expect them to.
 *
 * `c`, `b` and `s` open a tool — crop mode, brightness, sharpen. The remaining
 * five tools have no letter: a shortcut nobody can guess is not worth the key.
 *
 * Held keys (compare) release on keyup and on window blur, so tabbing away
 * mid-hold cannot strand the preview showing the original.
 */
export function useKeyboard({
  containerRef,
  fullscreen,
  paused = false,
  onEscape,
  onDownload,
  onSelectTool,
}) {
  const { hasImage } = useStudio()
  const a = useStudioActions()

  useEffect(() => {
    if (paused) return

    const inScope = () =>
      fullscreen || Boolean(containerRef.current?.contains(document.activeElement))

    const onKeyDown = (e) => {
      if (!inScope()) return
      const mod = e.metaKey || e.ctrlKey

      if (e.key === 'Escape') {
        onEscape?.()
        return
      }

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) a.redo()
        else a.undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        a.redo()
        return
      }
      if (mod && (e.key.toLowerCase() === 's' || e.key === 'Enter')) {
        e.preventDefault()
        if (hasImage) onDownload?.()
        return
      }

      // Everything below is a bare key — never steal it from a text field.
      if (isTypingTarget(e.target) || mod || e.altKey) return
      if (!hasImage) return

      switch (e.key) {
        case '\\':
          if (!e.repeat) a.setComparing(true)
          break
        case 'c':
          onSelectTool?.('crop')
          break
        case 'b':
          onSelectTool?.('brightness')
          break
        case 's':
          onSelectTool?.('sharpen')
          break
        case 'r':
          a.rotate(e.shiftKey ? -1 : 1)
          break
        case 'f':
          a.flip()
          break
        case '0':
          a.zoomFit()
          break
        case '1':
          a.zoomActual()
          break
        case '+':
        case '=':
          a.zoomStep(1)
          break
        case '-':
        case '_':
          a.zoomStep(-1)
          break
        default:
          return
      }
      e.preventDefault()
    }

    const onKeyUp = (e) => {
      if (e.key === '\\') a.setComparing(false)
    }
    const onBlur = () => a.setComparing(false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [containerRef, fullscreen, paused, hasImage, onEscape, onDownload, onSelectTool, a])
}
