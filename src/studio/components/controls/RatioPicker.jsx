import { aspectRatios } from '../../config'
import { useStudio, useStudioActions } from '../../StudioProvider'
import './RatioPicker.css'

/**
 * Aspect ratio as a radiogroup — these are mutually exclusive choices, not a
 * row of independent toggles, and assistive tech should hear it that way.
 */
export default function RatioPicker() {
  const { edit, hasImage } = useStudio()
  const { setAspect } = useStudioActions()

  return (
    <div className="ratio" role="radiogroup" aria-label="Aspect ratio">
      {aspectRatios.map((r) => {
        const checked = edit.aspect === r.id
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={checked}
            className={`ratio__opt${checked ? ' is-active' : ''}`}
            onClick={() => setAspect(r.id)}
            disabled={!hasImage}
          >
            <span className={`ratio__glyph ratio__glyph--${r.id.replace(':', '-')}`} aria-hidden="true" />
            {r.label}
          </button>
        )
      })}
    </div>
  )
}
