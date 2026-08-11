import { useEffect, useRef, useState } from 'react'
import { ArrowUp, FileText, Link2, Loader2, Paperclip, Sparkles, X } from 'lucide-react'
import { characters } from '../../data/characters'
import './PromptDock.css'

/**
 * The prompt bar, pinned to the foot of the canvas.
 *
 * It is always present and always in the same place — the editor is a fixed
 * height, so this is simply the bottom row of the stage rather than something
 * that scrolls in and out of reach. Character selection lives in the left rail
 * now; what surfaces here is a count, so you can always see how many are
 * attached without the roster eating into the picture.
 *
 * Prompt, characters and references are captured for real. There is no
 * generation model behind it, so Generate runs a genuine pending state and then
 * says plainly that it isn't connected rather than inventing a result.
 */
export default function PromptDock({ hasImage, selectedCharacters, onClearCharacters }) {
  const [prompt, setPrompt] = useState('')
  const [refs, setRefs] = useState([])
  const [refMenuOpen, setRefMenuOpen] = useState(false)
  const [status, setStatus] = useState('idle') // idle | generating | unavailable

  const dockRef = useRef(null)
  const imgRef = useRef(null)
  const pdfRef = useRef(null)

  const hasContent =
    prompt.trim().length > 0 || selectedCharacters.length > 0 || refs.length > 0

  useEffect(() => {
    if (!refMenuOpen) return
    const onDown = (e) => {
      if (!dockRef.current?.contains(e.target)) setRefMenuOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setRefMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [refMenuOpen])

  const addRef = (item) =>
    setRefs((r) => [...r, { ...item, key: `${item.type}-${r.length}-${item.name}` }])

  const onAddLink = () => {
    const url = window.prompt('Paste a reference URL')
    if (!url?.trim()) return
    let name = url.trim()
    try {
      const u = new URL(name)
      name = u.hostname.replace(/^www\./, '') + u.pathname
    } catch {
      /* not a URL — keep the raw text as the label */
    }
    addRef({ type: 'link', name })
    setRefMenuOpen(false)
  }

  const generate = () => {
    if (status === 'generating') return
    setStatus('generating')
    setTimeout(() => setStatus('unavailable'), 1500)
  }

  const names = selectedCharacters
    .map((id) => characters.find((c) => c.id === id)?.name)
    .filter(Boolean)

  return (
    <div className="dock" ref={dockRef}>
      {status === 'unavailable' && (
        <p className="dock__notice" role="status">
          <Sparkles size={14} aria-hidden="true" />
          <span>
            AI generation isn’t connected in this build — your prompt, characters and
            references were captured. The editing tools do change the image for real.
          </span>
          <button type="button" onClick={() => setStatus('idle')} aria-label="Dismiss">
            <X size={14} aria-hidden="true" />
          </button>
        </p>
      )}

      {refs.length > 0 && (
        <div className="dock__chips">
          {refs.map((r) => (
            <span className="dock__chip" key={r.key}>
              {r.type === 'link' && <Link2 size={12} aria-hidden="true" />}
              {r.type === 'pdf' && <FileText size={12} aria-hidden="true" />}
              {r.type === 'image' && <Paperclip size={12} aria-hidden="true" />}
              <span className="dock__chip-name">{r.name}</span>
              <button
                type="button"
                onClick={() => setRefs((list) => list.filter((x) => x.key !== r.key))}
                aria-label={`Remove reference ${r.name}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="dock__bar">
        <div className="dock__attach">
          <button
            type="button"
            className={`dock__icon${refMenuOpen ? ' is-active' : ''}`}
            onClick={() => setRefMenuOpen((o) => !o)}
            aria-label="Add a reference"
            aria-expanded={refMenuOpen}
            title="Add a reference"
          >
            <Paperclip size={17} strokeWidth={1.9} aria-hidden="true" />
          </button>

          {refMenuOpen && (
            <div className="dock__menu" role="menu" aria-label="Add a reference">
              <button type="button" role="menuitem" onClick={() => imgRef.current?.click()}>
                <Paperclip size={15} aria-hidden="true" />
                Upload image
              </button>
              <button type="button" role="menuitem" onClick={() => pdfRef.current?.click()}>
                <FileText size={15} aria-hidden="true" />
                Upload PDF
              </button>
              <button type="button" role="menuitem" onClick={onAddLink}>
                <Link2 size={15} aria-hidden="true" />
                Add link
              </button>
            </div>
          )}
        </div>

        {names.length > 0 && (
          <button
            type="button"
            className="dock__count"
            onClick={onClearCharacters}
            title={`${names.join(', ')} — click to clear`}
            aria-label={`${names.length} characters attached: ${names.join(', ')}. Clear them.`}
          >
            {names.length === 1 ? names[0] : `${names.length} characters`}
            <X size={12} aria-hidden="true" />
          </button>
        )}

        <input
          className="dock__input"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && hasContent) generate()
          }}
          placeholder={
            hasImage
              ? 'Describe an edit — e.g. “warmer evening light”'
              : 'Select an image to begin'
          }
          aria-label="Describe how you want to edit or generate the image"
        />

        <button
          type="button"
          className="dock__send"
          onClick={generate}
          disabled={!hasContent || status === 'generating'}
          aria-label="Generate"
        >
          {status === 'generating' ? (
            <Loader2 className="dock__spin" size={16} aria-hidden="true" />
          ) : (
            <ArrowUp size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
        </button>

        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) addRef({ type: 'image', name: f.name })
            e.target.value = ''
            setRefMenuOpen(false)
          }}
        />
        <input
          ref={pdfRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) addRef({ type: 'pdf', name: f.name })
            e.target.value = ''
            setRefMenuOpen(false)
          }}
        />
      </div>
    </div>
  )
}
