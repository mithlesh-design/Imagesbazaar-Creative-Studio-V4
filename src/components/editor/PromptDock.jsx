import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  FileText,
  Link2,
  Loader2,
  Paperclip,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { characters } from '../../data/characters'
import './PromptDock.css'

/**
 * Floating prompt bar pinned over the lower edge of the stage.
 *
 * Prompt, characters and references are all captured for real. There is no
 * generation model behind it, so Generate runs a genuine pending state and
 * then says plainly that it isn't connected rather than inventing a result.
 */
export default function PromptDock({ hasImage }) {
  const [prompt, setPrompt] = useState('')
  const [refs, setRefs] = useState([])
  const [picker, setPicker] = useState(null) // 'characters' | 'refs' | null
  const [gender, setGender] = useState('male')
  const [selected, setSelected] = useState([])
  const [status, setStatus] = useState('idle') // idle | generating | unavailable

  const dockRef = useRef(null)
  const imgRef = useRef(null)
  const pdfRef = useRef(null)

  useEffect(() => {
    if (!picker) return
    const onDown = (e) => {
      if (!dockRef.current?.contains(e.target)) setPicker(null)
    }
    const onKey = (e) => e.key === 'Escape' && setPicker(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [picker])

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
    setPicker(null)
  }

  const toggleCharacter = (name) =>
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]))

  const generate = () => {
    if (status === 'generating') return
    setStatus('generating')
    setTimeout(() => setStatus('unavailable'), 1600)
  }

  const canGenerate = prompt.trim().length > 0 || selected.length > 0 || refs.length > 0

  return (
    <div className="dock" ref={dockRef}>
      {/* Chips for whatever has been attached */}
      {(selected.length > 0 || refs.length > 0) && (
        <div className="dock__chips">
          {selected.map((name) => (
            <span className="dock__chip dock__chip--char" key={name}>
              <UserRound size={13} aria-hidden="true" />
              {name}
              <button type="button" onClick={() => toggleCharacter(name)} aria-label={`Remove ${name}`}>
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          ))}
          {refs.map((r) => (
            <span className="dock__chip" key={r.key}>
              {r.type === 'link' && <Link2 size={13} aria-hidden="true" />}
              {r.type === 'pdf' && <FileText size={13} aria-hidden="true" />}
              {r.type === 'image' && <Paperclip size={13} aria-hidden="true" />}
              <span className="dock__chip-name">{r.name}</span>
              <button
                type="button"
                onClick={() => setRefs((list) => list.filter((x) => x.key !== r.key))}
                aria-label={`Remove reference ${r.name}`}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      {status === 'unavailable' && (
        <p className="dock__notice" role="status">
          <Sparkles size={14} aria-hidden="true" />
          AI generation isn’t connected in this build — your prompt, characters and references
          were captured. The editing tools above do change the image for real.
          <button type="button" onClick={() => setStatus('idle')} aria-label="Dismiss">
            <X size={14} aria-hidden="true" />
          </button>
        </p>
      )}

      {/* Character picker */}
      {picker === 'characters' && (
        <div className="dock__pop" role="group" aria-label="Choose characters">
          <div className="dock__pop-head">
            <span>ImagesBazaar characters</span>
            <div className="dock__toggle">
              {['male', 'female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  className={gender === g ? 'is-active' : ''}
                  aria-pressed={gender === g}
                  onClick={() => setGender(g)}
                >
                  {g === 'male' ? 'Male' : 'Female'}
                </button>
              ))}
            </div>
          </div>
          <ul className="dock__chars">
            {characters[gender].map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`dock__char${selected.includes(c.name) ? ' is-selected' : ''}`}
                  aria-pressed={selected.includes(c.name)}
                  onClick={() => toggleCharacter(c.name)}
                  title={c.note}
                >
                  <span className="dock__avatar" aria-hidden="true">
                    {c.name.charAt(0)}
                  </span>
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reference menu */}
      {picker === 'refs' && (
        <div className="dock__pop dock__pop--refs" role="menu" aria-label="Add a reference">
          <button type="button" role="menuitem" onClick={() => imgRef.current?.click()}>
            <Paperclip size={16} aria-hidden="true" />
            Upload image
          </button>
          <button type="button" role="menuitem" onClick={() => pdfRef.current?.click()}>
            <FileText size={16} aria-hidden="true" />
            Upload PDF
          </button>
          <button type="button" role="menuitem" onClick={onAddLink}>
            <Link2 size={16} aria-hidden="true" />
            Add link
          </button>
        </div>
      )}

      {/* The bar itself */}
      <div className="dock__bar">
        <button
          type="button"
          className={`dock__icon${picker === 'characters' ? ' is-active' : ''}`}
          onClick={() => setPicker(picker === 'characters' ? null : 'characters')}
          aria-label="Choose a character"
          aria-expanded={picker === 'characters'}
          title="Choose a character"
        >
          <UserRound size={19} strokeWidth={1.9} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={`dock__icon${picker === 'refs' ? ' is-active' : ''}`}
          onClick={() => setPicker(picker === 'refs' ? null : 'refs')}
          aria-label="Add a reference"
          aria-expanded={picker === 'refs'}
          title="Add a reference"
        >
          <Paperclip size={19} strokeWidth={1.9} aria-hidden="true" />
        </button>

        <input
          className="dock__input"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canGenerate) generate()
          }}
          placeholder={
            hasImage ? 'Describe an edit — e.g. “warmer evening light”' : 'Select an image to begin'
          }
          aria-label="Describe how you want to edit or generate the image"
        />

        <button
          type="button"
          className="dock__send"
          onClick={generate}
          disabled={!canGenerate || status === 'generating'}
          aria-label="Generate"
        >
          {status === 'generating' ? (
            <Loader2 className="dock__spin" size={18} aria-hidden="true" />
          ) : (
            <ArrowUp size={18} strokeWidth={2.4} aria-hidden="true" />
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
            setPicker(null)
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
            setPicker(null)
          }}
        />
      </div>
    </div>
  )
}
