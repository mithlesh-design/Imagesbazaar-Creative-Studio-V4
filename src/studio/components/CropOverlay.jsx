import { useRef, useState } from 'react'
import { moveCrop, resizeCrop } from '../cropMath'
import { useStudio, useStudioActions } from '../StudioProvider'
import './CropOverlay.css'

const HANDLES = [
  { id: 'nw', label: 'top left' },
  { id: 'n', label: 'top' },
  { id: 'ne', label: 'top right' },
  { id: 'e', label: 'right' },
  { id: 'se', label: 'bottom right' },
  { id: 's', label: 'bottom' },
  { id: 'sw', label: 'bottom left' },
  { id: 'w', label: 'left' },
]

/**
 * Direct-manipulation crop.
 *
 * Sits over a stage that is rendering the *whole* frame, so the dimmed area is
 * literally the part being cut away. All arithmetic happens in base pixels —
 * pointer deltas are divided by the display scale on the way in — which keeps
 * the crop exact regardless of zoom.
 *
 * The whole gesture is bracketed by begin/commit so a drag lands as one undo
 * step rather than several hundred.
 */
export default function CropOverlay({ baseSize, crop, displayW, displayH }) {
  const { ratio } = useStudio()
  const a = useStudioActions()
  const [active, setActive] = useState(null) // 'move' | handle id
  const rootRef = useRef(null)

  const scale = baseSize.w ? displayW / baseSize.w : 1
  if (!baseSize.w || !baseSize.h) return null

  const box = {
    left: crop.x * scale,
    top: crop.y * scale,
    width: crop.w * scale,
    height: crop.h * scale,
  }

  /** Shared pointer bookkeeping for both moving and resizing. */
  const startDrag = (e, mode) => {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startCrop = crop
    const node = rootRef.current
    node.setPointerCapture(e.pointerId)

    setActive(mode)
    a.begin()

    const move = (ev) => {
      const dx = (ev.clientX - startX) / scale
      const dy = (ev.clientY - startY) / scale
      a.setCrop(
        mode === 'move'
          ? moveCrop(startCrop, dx, dy, baseSize)
          : resizeCrop(startCrop, mode, dx, dy, baseSize, ratio)
      )
    }
    const end = () => {
      node.releasePointerCapture?.(e.pointerId)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerup', end)
      node.removeEventListener('pointercancel', end)
      setActive(null)
      a.commit()
    }

    node.addEventListener('pointermove', move)
    node.addEventListener('pointerup', end)
    node.addEventListener('pointercancel', end)
  }

  /** Keyboard equivalents, so the crop is not mouse-only. */
  const onKeyDown = (e, mode) => {
    const step = e.shiftKey ? 10 : 1
    let dx = 0
    let dy = 0
    if (e.key === 'ArrowLeft') dx = -step
    else if (e.key === 'ArrowRight') dx = step
    else if (e.key === 'ArrowUp') dy = -step
    else if (e.key === 'ArrowDown') dy = step
    else return

    e.preventDefault()
    a.begin()
    a.setCrop(
      mode === 'move'
        ? moveCrop(crop, dx, dy, baseSize)
        : resizeCrop(crop, mode, dx, dy, baseSize, ratio)
    )
    a.commit()
  }

  return (
    <div className="crop" ref={rootRef}>
      {/* The scrim is clipped to the picture so it dims only what is being cut
          away, never the mat around it. Kept as a sibling of the box so the
          handles, which overhang the frame, are not clipped with it. */}
      <div className="crop__scrim-clip" aria-hidden="true">
        <div className="crop__scrim" style={box} />
      </div>

      <div
        className={`crop__box${active ? ' is-active' : ''}`}
        style={box}
        role="group"
        aria-label={`Crop frame, ${Math.round(crop.w)} by ${Math.round(crop.h)} pixels. Arrow keys move it.`}
        tabIndex={0}
        onPointerDown={(e) => startDrag(e, 'move')}
        onKeyDown={(e) => onKeyDown(e, 'move')}
      >
        <span className="crop__grid" aria-hidden="true" />

        {HANDLES.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`crop__handle crop__handle--${h.id}`}
            aria-label={`Resize crop from the ${h.label}`}
            onPointerDown={(e) => startDrag(e, h.id)}
            onKeyDown={(e) => onKeyDown(e, h.id)}
          />
        ))}

        <span className="crop__size" aria-hidden="true">
          {Math.round(crop.w)} × {Math.round(crop.h)}
        </span>
      </div>
    </div>
  )
}
