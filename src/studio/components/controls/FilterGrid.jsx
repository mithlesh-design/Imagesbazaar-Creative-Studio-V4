import { useEffect, useRef } from 'react'
import { filterPresets } from '../../config'
import { useStudio, useStudioActions } from '../../StudioProvider'
import './FilterGrid.css'

const THUMB = 64

/**
 * Filter presets shown as live thumbnails of the actual photo.
 *
 * Cheap by construction: the crop is downscaled *once* into a shared offscreen
 * canvas, and each swatch then redraws that 64px thumbnail through its own CSS
 * filter. Eight swatches cost eight 64×64 blits, not eight full-image renders.
 */
export default function FilterGrid() {
  const { baseRef, baseVersion, edit, hasImage } = useStudio()
  const { setFilter } = useStudioActions()
  const refs = useRef({})

  const { crop, adjustments } = edit
  const active = adjustments.filter

  useEffect(() => {
    const base = baseRef.current
    if (!base || !crop.w || !crop.h) return

    // One shared downscale of the crop, square-cropped from its centre.
    const side = Math.min(crop.w, crop.h)
    const sx = crop.x + (crop.w - side) / 2
    const sy = crop.y + (crop.h - side) / 2

    const dpr = window.devicePixelRatio || 1
    const px = Math.round(THUMB * dpr)

    const thumb = document.createElement('canvas')
    thumb.width = px
    thumb.height = px
    thumb.getContext('2d').drawImage(base, sx, sy, side, side, 0, 0, px, px)

    for (const preset of filterPresets) {
      const canvas = refs.current[preset.id]
      if (!canvas) continue
      if (canvas.width !== px) {
        canvas.width = px
        canvas.height = px
      }
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, px, px)
      ctx.filter = preset.css || 'none'
      ctx.drawImage(thumb, 0, 0)
      ctx.filter = 'none'
    }
  }, [baseRef, baseVersion, crop.x, crop.y, crop.w, crop.h])

  return (
    <div className="fgrid" role="radiogroup" aria-label="Filter preset">
      {filterPresets.map((f) => {
        const checked = active === f.id
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={checked}
            className={`fgrid__item${checked ? ' is-active' : ''}`}
            onClick={() => setFilter(f.id)}
            disabled={!hasImage}
          >
            <span className="fgrid__thumb">
              <canvas
                ref={(el) => {
                  refs.current[f.id] = el
                }}
                width={THUMB}
                height={THUMB}
                aria-hidden="true"
              />
            </span>
            <span className="fgrid__label">{f.label}</span>
          </button>
        )
      })}
    </div>
  )
}
