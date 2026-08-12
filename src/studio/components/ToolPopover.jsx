import { useEffect, useRef } from 'react'
import { FlipHorizontal, Info, RotateCcw, RotateCw } from 'lucide-react'
import { useStudio, useStudioActions } from '../StudioProvider'
import Slider from './controls/Slider'
import FilterGrid from './controls/FilterGrid'
import './ToolPopover.css'

/**
 * The controls for one tool, floating over its button in the strip.
 *
 * Everything inside is a component that already existed — `Slider` with its
 * fill-from-default track, `FilterGrid` with its live thumbnails of your own
 * photo. This is a container and a position, not a new set of controls.
 *
 * `place` is solved by `EditToolbar`: `{ width, left, arrow }` in pixels. The
 * box is clamped to the card's edges, so it can be pinned while its trigger is
 * not — which is why the arrow carries its own offset rather than simply being
 * a corner of the box.
 */
export default function ToolPopover({ tool, place, onClose }) {
  const { edit } = useStudio()
  const a = useStudioActions()
  const ref = useRef(null)

  const { adjustments, rotation, flipH } = edit

  // Escape closes this before it closes full screen — the innermost thing
  // opened is the first thing dismissed.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    const node = ref.current
    node?.addEventListener('keydown', onKey)
    return () => node?.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="tpop"
      role="dialog"
      aria-label={tool.label}
      ref={ref}
      style={{ width: `${place.width}px`, left: `${place.left}px` }}
    >
      <div className="tpop__body">
        <h3 className="tpop__title">{tool.label}</h3>

        {tool.id === 'rotate' && (
          <span className="tpop__readout">
            {rotation}°{flipH && ' · flipped'}
          </span>
        )}

        {tool.sliders && (
          <div className="tpop__sliders">
            {tool.sliders.map((s) => (
              <Slider
                key={s.key}
                label={s.label}
                value={adjustments[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                suffix={s.suffix}
                reset={s.reset}
                onBegin={a.begin}
                onCommit={a.commit}
                onChange={(v) => a.setAdjustment(s.key, v)}
              />
            ))}
          </div>
        )}

        {tool.presets && <FilterGrid />}

        {tool.actions && (
          <div className="tpop__actions">
            <button type="button" className="tpop__action" onClick={() => a.rotate(-1)}>
              <RotateCcw size={15} aria-hidden="true" />
              Left 90°
            </button>
            <button type="button" className="tpop__action" onClick={() => a.rotate(1)}>
              <RotateCw size={15} aria-hidden="true" />
              Right 90°
            </button>
            <button type="button" className="tpop__action" onClick={a.flip}>
              <FlipHorizontal size={15} aria-hidden="true" />
              Flip
            </button>
          </div>
        )}

        {tool.hint && (
          <p className="tpop__hint">
            <Info size={13} aria-hidden="true" />
            {tool.hint}
          </p>
        )}
      </div>

      <span className="tpop__arrow" style={{ left: `${place.arrow}px` }} aria-hidden="true" />
    </div>
  )
}
