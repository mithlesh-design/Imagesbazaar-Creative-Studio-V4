import { useCallback, useEffect, useRef, useState } from 'react'
import { heroTourSteps } from '../tour/heroTourSteps'
import { hasSeenTour, markTourSeen } from '../tour/tourStorage'

/** Waited out before the tour appears. Firing at t=0 reads as an ambush, and
 *  lands before Manrope has swapped in and reflowed the hero. */
const SETTLE_MS = 600

/** Any open modal outranks the tour. Matching on the ARIA contract rather than a
 *  class list means a new modal is covered without touching this file. */
const MODAL = '[role="dialog"][aria-modal="true"]'

const rectOf = (el) => {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

const sameRect = (a, b) =>
  a === b ||
  (Boolean(a) &&
    Boolean(b) &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5)

/**
 * Drives the first-run hero walkthrough.
 *
 * Measurement is a single rAF loop rather than resize/scroll listeners plus a
 * ResizeObserver, because the cases that matter here are exactly the ones an
 * event-driven version misses:
 *
 *  - Attaching a reference inserts a chip list between the textarea and the
 *    controls row. `.heroprompt` has a min-height and the textarea is `flex: 1`,
 *    so the box never changes size — the buttons only change *position*, and
 *    ResizeObserver does not observe position.
 *  - Opening a modal runs `useLockBodyScroll`, which adds a scrollbar-width
 *    `padding-right` and shifts the whole page sideways. No event fires.
 *  - `Home` smooth-scrolls to results; throttled scroll handlers judder against it.
 *  - The webfont loads and reflows the hero.
 *
 * Three getBoundingClientRects per frame, for under a minute, on an otherwise
 * idle page — cheap, with no missed-case surface.
 */
export function useHeroTour({ onFinish } = {}) {
  const [status, setStatus] = useState('idle')
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const [spotRect, setSpotRect] = useState(null)
  const [boxRect, setBoxRect] = useState(null)

  const rafRef = useRef(0)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const finish = useCallback((outcome) => {
    markTourSeen(outcome)
    setStatus('dismissed')
    setPaused(false)
    onFinishRef.current?.(outcome)
  }, [])

  const start = useCallback(() => {
    setStep(0)
    setPaused(false)
    setStatus('running')
  }, [])

  const next = useCallback(
    () => setStep((s) => (s >= heroTourSteps.length - 1 ? s : s + 1)),
    []
  )
  const back = useCallback(() => setStep((s) => (s <= 0 ? 0 : s - 1)), [])

  /**
   * Auto-start for a visitor who has not seen it.
   *
   * Deliberately NOT guarded by a mount-once ref. StrictMode mounts, unmounts
   * and remounts in dev: a ref claimed on the first mount is still set on the
   * second, whose effect would then early-return — and the cleanup has already
   * cancelled the first mount's timer, so the tour never arms at all. Since
   * `setStatus('running')` is idempotent, arming twice costs nothing and the
   * cleanup below makes it safe.
   */
  useEffect(() => {
    if (hasSeenTour()) return undefined

    let timer = 0
    let cancelled = false
    const arm = () => {
      if (cancelled) return
      timer = window.setTimeout(() => {
        if (!cancelled) setStatus('running')
      }, SETTLE_MS)
    }

    // `document.fonts` is absent in some older engines; arm regardless.
    if (document.fonts?.ready) document.fonts.ready.then(arm).catch(arm)
    else arm()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  // The measurement loop. Runs only while the tour is up.
  useEffect(() => {
    if (status !== 'running') return undefined

    const tick = () => {
      const target = document.querySelector(
        `[data-tour="${heroTourSteps[step].target}"]`
      )
      const box = document.querySelector('.heroprompt')

      setPaused((p) => {
        const open = Boolean(document.querySelector(MODAL))
        return p === open ? p : open
      })
      setSpotRect((prev) => {
        const nextRect = rectOf(target)
        return sameRect(prev, nextRect) ? prev : nextRect
      })
      setBoxRect((prev) => {
        const nextRect = rectOf(box)
        return sameRect(prev, nextRect) ? prev : nextRect
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [status, step])

  // A step whose target is not in the DOM is skipped rather than spotlighted at
  // the origin. Only runs once a measurement pass has reported null.
  useEffect(() => {
    if (status !== 'running' || paused || spotRect) return
    const el = document.querySelector(`[data-tour="${heroTourSteps[step].target}"]`)
    if (el) return
    if (step < heroTourSteps.length - 1) setStep((s) => s + 1)
  }, [status, paused, spotRect, step])

  /**
   * Escape skips — and stands down while a modal is open.
   *
   * `useFocusTrap` uses stopPropagation, not stopImmediatePropagation, from its
   * own document-level listener. Both listeners on `document` therefore fire, so
   * without this guard Escape inside the links modal would close the modal *and*
   * skip the tour. Arrow keys live on the tooltip element for the same reason.
   */
  useEffect(() => {
    if (status !== 'running') return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape' || paused) return
      finish('skipped')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [status, paused, finish])

  return {
    status,
    step,
    steps: heroTourSteps,
    paused,
    spotRect,
    boxRect,
    isRunning: status === 'running',
    start,
    next,
    back,
    skip: () => finish('skipped'),
    complete: () => finish('completed'),
  }
}
