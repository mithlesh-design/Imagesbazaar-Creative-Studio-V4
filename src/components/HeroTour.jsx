import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './HeroTour.css'

const GAP = 14 /* between the prompt box and the tooltip */
const EDGE = 16 /* minimum breathing room against a viewport edge */
const CARET_INSET = 18 /* keeps the caret off the tooltip's rounded corners */

/**
 * The walkthrough's spotlight and tooltip.
 *
 * Portalled to `document.body`, which is a hard requirement rather than a
 * preference: `scripts/shoot.mjs` asserts the hero fits its first screen by
 * summing `.hero`'s children heights, so any new child of `.hero` fails that
 * gate — `position: absolute` included, since it still reports a real height.
 */
export default function HeroTour({
  steps,
  step,
  spotRect,
  boxRect,
  paused,
  onNext,
  onBack,
  onSkip,
  onComplete,
}) {
  const tipRef = useRef(null)
  const [tipSize, setTipSize] = useState({ width: 320, height: 150 })
  const [moving, setMoving] = useState(false)

  const current = steps[step]
  const isLast = step === steps.length - 1

  // Measured, not hardcoded. EditToolbar has to keep its popover widths in JS
  // because it places before it can measure; here the tooltip is already
  // rendered, so a duplicated constant would only be a second source of truth.
  useLayoutEffect(() => {
    const el = tipRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setTipSize((prev) =>
      Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5
        ? prev
        : { width: r.width, height: r.height }
    )
  }, [step, spotRect, boxRect])

  // The travel transition is enabled only while changing step. Left on
  // permanently, the spotlight visibly lags the target during any scroll,
  // because the same inline top/left are rewritten every frame.
  useEffect(() => {
    setMoving(true)
    const t = window.setTimeout(() => setMoving(false), 320)
    return () => window.clearTimeout(t)
  }, [step])

  // Focus the tooltip when the tour opens — once, not on every step. Moving
  // focus each step would fight the point of the exercise, which is that the
  // highlighted control stays usable.
  useEffect(() => {
    tipRef.current?.focus()
  }, [])

  if (!spotRect) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const sheet = vw <= 640

  /* Vertical placement is anchored to the prompt box, not the target, so the
     tooltip holds its line across all four steps and only slides sideways —
     the caret does the pointing. */
  const anchor = boxRect ?? spotRect
  const below = vh - (anchor.top + anchor.height) >= tipSize.height + GAP + EDGE
  const top = below
    ? anchor.top + anchor.height + GAP
    : Math.max(EDGE, anchor.top - tipSize.height - GAP)

  /* The clamp-and-caret idiom from EditToolbar.jsx — deliberately the same one,
     rather than a second placement algorithm in this codebase. */
  const spotCentre = spotRect.left + spotRect.width / 2
  const left = Math.max(
    EDGE,
    Math.min(spotCentre - tipSize.width / 2, vw - tipSize.width - EDGE)
  )
  const caretX = Math.max(
    CARET_INSET,
    Math.min(spotCentre - left, tipSize.width - CARET_INSET)
  )

  /* On a phone the sheet is the full width of the screen, so it can land on top
     of the very control it is describing — the prompt's controls row sits low,
     and a bottom sheet covered it outright. Flip to the top edge when the
     bottom would overlap the spotlight. */
  const sheetBottomOverlaps = vh - EDGE - tipSize.height < spotRect.top + spotRect.height
  const sheetTopOverlaps = EDGE + tipSize.height > spotRect.top
  const sheetAtTop = sheet && sheetBottomOverlaps && !sheetTopOverlaps

  const tipStyle = sheet ? undefined : { top: `${top}px`, left: `${left}px` }

  return createPortal(
    <div className={`herotour${paused ? ' is-paused' : ''}`}>
      <div
        className={`herotour__spot${moving ? ' is-moving' : ''}`}
        data-step={current.target}
        style={{
          top: `${spotRect.top}px`,
          left: `${spotRect.left}px`,
          width: `${spotRect.width}px`,
          height: `${spotRect.height}px`,
        }}
      />

      <div
        className={`herotour__tip${sheet ? ' is-sheet' : ''}${sheetAtTop ? ' is-sheet-top' : ''}${moving ? ' is-moving' : ''}`}
        ref={tipRef}
        style={tipStyle}
        role="dialog"
        aria-labelledby="herotour-title"
        aria-describedby="herotour-body"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            isLast ? onComplete() : onNext()
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            onBack()
          }
        }}
      >
        {!sheet && (
          <span
            className={`herotour__caret${below ? '' : ' is-below'}`}
            style={{ left: `${caretX}px` }}
            aria-hidden="true"
          />
        )}

        <p className="herotour__count">
          Step {step + 1} of {steps.length}
        </p>
        <h2 className="herotour__title" id="herotour-title">
          {current.title}
        </h2>
        <p className="herotour__body" id="herotour-body">
          {current.body}
        </p>

        <div className="herotour__actions">
          <button type="button" className="herotour__skip" onClick={onSkip}>
            Skip
          </button>
          <span className="herotour__spacer" />
          {step > 0 && (
            <button type="button" className="herotour__back" onClick={onBack}>
              Back
            </button>
          )}
          <button
            type="button"
            className="herotour__next"
            onClick={isLast ? onComplete : onNext}
          >
            {isLast ? 'Start Creating' : 'Next'}
          </button>
        </div>
      </div>

      {/* A sibling of the tooltip, not a child: text changing inside an
          already-announced dialog is not reliably re-read. */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {paused ? '' : `Step ${step + 1} of ${steps.length}. ${current.title}.`}
      </span>
    </div>,
    document.body
  )
}
