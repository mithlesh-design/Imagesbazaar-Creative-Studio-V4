import { useEffect, useRef, useState } from 'react'
import { Facebook, Globe, Instagram, Twitter, X } from 'lucide-react'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useFocusTrap } from '../hooks/useFocusTrap'
import './ReferenceLinksModal.css'

/** One field per source. `kind` is what the attached chip reports. */
const FIELDS = [
  { id: 'website', label: 'Website link', kind: 'Website', icon: Globe, placeholder: 'https://brand.com' },
  { id: 'instagram', label: 'Instagram page link', kind: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/brand' },
  { id: 'facebook', label: 'Facebook page link', kind: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/brand' },
  { id: 'twitter', label: 'Twitter / X page link', kind: 'Twitter/X', icon: Twitter, placeholder: 'https://x.com/brand' },
]

const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.id, '']))

/** Shortens a URL to host + path for the chip; falls back to the raw text if
 *  it will not parse, so a half-typed address still labels something. */
function label(raw) {
  const text = raw.trim()
  try {
    const u = new URL(text.startsWith('http') ? text : `https://${text}`)
    return (u.hostname.replace(/^www\./, '') + u.pathname).replace(/\/$/, '')
  } catch {
    return text
  }
}

/**
 * Collects reference links by source in one pass, rather than asking for one
 * URL at a time through `window.prompt`. Fields are independent: whichever are
 * filled get attached, the rest are ignored.
 */
export default function ReferenceLinksModal({ open, onClose, onAttach }) {
  const [values, setValues] = useState(EMPTY)
  const panelRef = useRef(null)

  useLockBodyScroll(open)
  useFocusTrap(panelRef, open, onClose)

  // Start clean on every open — a stale half-typed URL from a cancelled attempt
  // reappearing later is worse than retyping it.
  useEffect(() => {
    if (!open) setValues(EMPTY)
  }, [open])

  if (!open) return null

  const filled = FIELDS.filter((f) => values[f.id].trim())

  const submit = (e) => {
    e.preventDefault()
    if (!filled.length) return
    onAttach(filled.map((f) => ({ type: 'link', kind: f.kind, name: label(values[f.id]) })))
    onClose()
  }

  return (
    <div className="rlm" role="presentation">
      <div className="rlm__backdrop" onClick={onClose} />

      <form
        className="rlm__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rlm-title"
        onSubmit={submit}
      >
        <div className="rlm__head">
          <h2 className="rlm__title" id="rlm-title">
            Add reference links
          </h2>
          <button type="button" className="rlm__close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="rlm__hint">
          Fill in whichever apply — every field is optional.
        </p>

        <div className="rlm__fields">
          {FIELDS.map((f) => {
            const Icon = f.icon
            return (
              <label className="rlm__field" key={f.id}>
                <span className="rlm__label">
                  <Icon size={14} aria-hidden="true" />
                  {f.label}
                </span>
                <input
                  className="rlm__input"
                  /* Deliberately `text`, not `url`. People type "instagram.com/brand"
                     without a scheme, and `type="url"` fails constraint validation on
                     that, which blocks the form submit with no visible explanation.
                     `inputMode` still gets the URL keyboard on a phone, and the scheme
                     is added below when the link is attached. */
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  placeholder={f.placeholder}
                  value={values[f.id]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                />
              </label>
            )
          })}
        </div>

        <div className="rlm__actions">
          <button type="button" className="rlm__cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="rlm__attach" disabled={!filled.length}>
            {filled.length ? `Attach ${filled.length} link${filled.length > 1 ? 's' : ''}` : 'Attach'}
          </button>
        </div>
      </form>
    </div>
  )
}
