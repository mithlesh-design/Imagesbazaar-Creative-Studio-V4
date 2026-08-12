import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { aspectPills, aspectRatios, customAspects } from '../../config'
import { useStudio, useStudioActions } from '../../StudioProvider'
import './RatioPills.css'

const label = (id) => aspectRatios.find((a) => a.id === id)?.label ?? id

/**
 * The crop every image starts on: its own proportions, i.e. uncropped.
 *
 * It is treated as the *absence* of a ratio rather than a choice of one, so
 * nothing in the row looks pre-selected before you have picked anything. The
 * menu still ticks it, so opening Custom tells you where you actually are.
 */
const NEUTRAL = 'original'

/** Reduces `custom:1600:900` to `16:9` so the pill reads like the others. */
function customLabel(aspect) {
  if (!aspect?.startsWith('custom:')) return null
  const [, w, h] = aspect.split(':')
  const a = Number(w)
  const b = Number(h)
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return 'Custom'
  const gcd = (x, y) => (y ? gcd(y, x % y) : x)
  const d = gcd(Math.round(a), Math.round(b)) || 1
  return `${Math.round(a) / d}:${Math.round(b) / d}`
}

/**
 * Crop ratios, as pills across the top of the canvas.
 *
 * Four get a pill because four is what people reach for. The rest — free-form,
 * the image's own proportions, portrait video, and anything you can type — sit
 * behind "Custom". Nothing was dropped in the move from the old picker; it was
 * ranked.
 */
export default function RatioPills() {
  const { edit, hasImage } = useStudio()
  const { setAspect } = useStudioActions()

  const [open, setOpen] = useState(false)
  const [w, setW] = useState('')
  const [h, setH] = useState('')

  const wrapRef = useRef(null)
  const triggerRef = useRef(null)

  const active = edit.aspect
  const isCustomFamily = !aspectPills.includes(active) && active !== NEUTRAL

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const applyTyped = () => {
    const a = Number(w)
    const b = Number(h)
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return
    setAspect(`custom:${a}:${b}`)
    close()
  }

  return (
    <div className="rpills">
      {/* Only the four fixed ratios are radios. The Custom trigger is a menu
          button — `role="radio"` forbids `aria-expanded`, so putting it in the
          group would be invalid ARIA, not merely untidy. */}
      <div className="rpills__set" role="radiogroup" aria-label="Crop aspect ratio">
        {aspectPills.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active === id}
            className={`rpills__pill${active === id ? ' is-active' : ''}`}
            disabled={!hasImage}
            onClick={() => setAspect(id)}
          >
            {label(id)}
          </button>
        ))}
      </div>

      <div className="rpills__custom" ref={wrapRef}>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={
            isCustomFamily
              ? `Custom crop ratio, currently ${customLabel(active) ?? label(active)}`
              : 'Custom crop ratio'
          }
          className={`rpills__pill rpills__pill--custom${isCustomFamily ? ' is-active' : ''}`}
          disabled={!hasImage}
          ref={triggerRef}
          onClick={() => setOpen((o) => !o)}
        >
          {isCustomFamily ? customLabel(active) ?? label(active) : 'Custom'}
          <ChevronDown size={13} strokeWidth={2.2} aria-hidden="true" />
        </button>

        {open && (
          <div
            className="rpills__menu"
            role="dialog"
            aria-label="Custom aspect ratio"
            onKeyDown={(e) => {
              if (e.key !== 'Escape') return
              e.stopPropagation() // don't also leave full screen
              close()
            }}
          >
            {customAspects.map((id) => (
              <button
                key={id}
                type="button"
                className={`rpills__option${active === id ? ' is-active' : ''}`}
                onClick={() => {
                  setAspect(id)
                  close()
                }}
              >
                <span>{label(id)}</span>
                {active === id && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
              </button>
            ))}

            <div className="rpills__typed">
              <label className="rpills__field">
                <span className="sr-only">Custom width</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="W"
                  value={w}
                  onChange={(e) => setW(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyTyped()}
                />
              </label>
              <span className="rpills__colon" aria-hidden="true">
                :
              </span>
              <label className="rpills__field">
                <span className="sr-only">Custom height</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="H"
                  value={h}
                  onChange={(e) => setH(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyTyped()}
                />
              </label>
              <button
                type="button"
                className="rpills__apply"
                onClick={applyTyped}
                disabled={!(Number(w) > 0 && Number(h) > 0)}
              >
                Set
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
