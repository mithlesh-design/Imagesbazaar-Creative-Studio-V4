import { forwardRef, useRef, useState } from 'react'
import { ArrowUp, FileText, ImagePlus, Link2, X } from 'lucide-react'
import './HeroPrompt.css'

const REF_ICON = { image: ImagePlus, pdf: FileText, link: Link2 }

/**
 * The hero's prompt box. Structure follows the reference pattern: a tall field
 * with a control row pinned to its foot — references on the left, submit on the
 * right, with the mic immediately left of it. `voiceSlot` is a slot rather than
 * a hardcoded child because the mic is absent entirely on browsers without
 * SpeechRecognition.
 */
const HeroPrompt = forwardRef(function HeroPrompt(
  { value, onChange, onSubmit, busy = false, voiceSlot = null },
  ref
) {
  const imgInputRef = useRef(null)
  const pdfInputRef = useRef(null)
  const nextRefId = useRef(0)
  const [references, setReferences] = useState([])

  const addLink = () => {
    const url = window.prompt('Paste a reference URL')
    if (!url?.trim()) return
    let name = url.trim()
    try {
      const u = new URL(name)
      name = u.hostname.replace(/^www\./, '') + u.pathname
    } catch {
      /* keep the raw text as the label */
    }
    setReferences((r) => [...r, { id: `link-${nextRefId.current++}-${name}`, type: 'link', name }])
  }

  const addFile = (type) => (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setReferences((r) => [
        ...r,
        { id: `${type}-${nextRefId.current++}-${file.name}`, type, name: file.name },
      ])
    }
    e.target.value = ''
  }

  const canSubmit = Boolean(value.trim()) && !busy

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSubmit) onSubmit()
    }
  }

  return (
    <div className="heroprompt">
      <textarea
        ref={ref}
        className="heroprompt__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Describe your campaign vision, target brand, and specific product"
        aria-label="Describe your campaign vision, target brand, and specific product"
        rows={1}
      />

      {references.length > 0 && (
        <ul className="heroprompt__refs">
          {references.map((r) => {
            const Icon = REF_ICON[r.type] ?? Link2
            return (
              <li className="heroprompt__ref" key={r.id}>
                <Icon size={13} aria-hidden="true" />
                <span className="heroprompt__ref-name">{r.name}</span>
                <button
                  type="button"
                  className="heroprompt__ref-remove"
                  onClick={() => setReferences((list) => list.filter((x) => x.id !== r.id))}
                  aria-label={`Remove reference ${r.name}`}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="heroprompt__controls">
        <button
          type="button"
          className="heroprompt__pill"
          onClick={addLink}
          aria-label="Add link reference"
        >
          <Link2 size={15} aria-hidden="true" />
          <span>Add link</span>
        </button>

        <button
          type="button"
          className="heroprompt__pill"
          onClick={() => imgInputRef.current?.click()}
          aria-label="Upload image reference"
        >
          <ImagePlus size={15} aria-hidden="true" />
          <span>Upload image</span>
        </button>

        <button
          type="button"
          className="heroprompt__pill"
          onClick={() => pdfInputRef.current?.click()}
          aria-label="Upload PDF reference"
        >
          <FileText size={15} aria-hidden="true" />
          <span>Upload PDF</span>
        </button>

        {voiceSlot}

        <button
          type="button"
          className="heroprompt__submit"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          <span>Generate</span>
          <ArrowUp size={16} aria-hidden="true" />
        </button>
      </div>

      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload a reference image"
        onChange={addFile('image')}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload a reference PDF"
        onChange={addFile('pdf')}
      />
    </div>
  )
})

export default HeroPrompt
