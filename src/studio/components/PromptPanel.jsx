import { useRef, useState } from 'react'
import { FileText, ImagePlus, Link2, Loader2, Sparkles, X } from 'lucide-react'
import { characters } from '../../data/characters'
import { useStudio, useStudioActions } from '../StudioProvider'
import './PromptPanel.css'

const REF_ICON = { image: ImagePlus, pdf: FileText, link: Link2 }

/**
 * The right card: what you want, and what you want it made from.
 *
 * Prompt, characters and references are captured for real. There is no
 * generation model behind this build, so Generate runs a genuine pending state
 * and then says plainly that it is not connected, rather than inventing a
 * result — the editing tools beside it do change the image for real, and
 * blurring that line would be the one unforgivable thing here.
 *
 * "Apply Edits" is the honest half of that pair: it flattens the crop, rotation
 * and adjustments into the image and starts a clean edit against the result, so
 * you can stack rounds of work. It is a real, undoable operation.
 */
export default function PromptPanel({
  prompt,
  onPromptChange,
  refs,
  onAddRef,
  onRemoveRef,
  selectedCharacters,
  onClearCharacters,
}) {
  const { hasImage, isEdited } = useStudio()
  const { bake } = useStudioActions()

  const [status, setStatus] = useState('idle') // idle | generating | unavailable

  const imgRef = useRef(null)
  const pdfRef = useRef(null)

  const names = selectedCharacters
    .map((id) => characters.find((c) => c.id === id)?.name)
    .filter(Boolean)

  const hasContent = prompt.trim().length > 0 || names.length > 0 || refs.length > 0

  const addLink = () => {
    const url = window.prompt('Paste a reference URL')
    if (!url?.trim()) return
    let name = url.trim()
    try {
      const u = new URL(name)
      name = u.hostname.replace(/^www\./, '') + u.pathname
    } catch {
      /* not a URL — keep the raw text as the label */
    }
    onAddRef({ type: 'link', name })
  }

  const generate = () => {
    if (status === 'generating') return
    setStatus('generating')
    setTimeout(() => setStatus('unavailable'), 1500)
  }

  return (
    <section className="ppanel" aria-labelledby="ppanel-heading">
      <h2 className="ppanel__title" id="ppanel-heading">
        Prompt
      </h2>

      <textarea
        className="ppanel__input"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Describe how you want to edit or generate the image..."
        aria-labelledby="ppanel-heading"
        rows={4}
      />

      {names.length > 0 && (
        <button
          type="button"
          className="ppanel__chars"
          onClick={onClearCharacters}
          title={`${names.join(', ')} — click to clear`}
          aria-label={`${names.length} characters attached: ${names.join(
            ', '
          )}. Clear them.`}
        >
          <span>{names.length === 1 ? names[0] : `${names.length} characters`}</span>
          <X size={13} aria-hidden="true" />
        </button>
      )}

      <h3 className="ppanel__legend" id="ppanel-refs">
        References
      </h3>

      <div className="ppanel__adders" role="group" aria-labelledby="ppanel-refs">
        <button type="button" className="ppanel__adder" onClick={() => imgRef.current?.click()}>
          <ImagePlus size={17} strokeWidth={1.7} aria-hidden="true" />
          Upload Image
        </button>
        <button type="button" className="ppanel__adder" onClick={addLink}>
          <Link2 size={17} strokeWidth={1.7} aria-hidden="true" />
          Add Link
        </button>
        <button type="button" className="ppanel__adder" onClick={() => pdfRef.current?.click()}>
          <FileText size={17} strokeWidth={1.7} aria-hidden="true" />
          Upload PDF
        </button>
      </div>

      {refs.length > 0 ? (
        <ul className="ppanel__refs">
          {refs.map((r) => {
            const Icon = REF_ICON[r.type] ?? Link2
            return (
              <li className="ppanel__ref" key={r.key}>
                <Icon size={14} aria-hidden="true" />
                <span className="ppanel__ref-name">{r.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveRef(r.key)}
                  aria-label={`Remove reference ${r.name}`}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="ppanel__empty">No references added yet</p>
      )}

      {status === 'unavailable' && (
        <p className="ppanel__notice" role="status">
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

      <div className="ppanel__cta">
        <button
          type="button"
          className="ppanel__generate"
          onClick={generate}
          disabled={!hasContent || status === 'generating'}
          title={
            hasContent
              ? 'Send the prompt, characters and references'
              : 'Write a prompt, attach a character, or add a reference first'
          }
        >
          {status === 'generating' ? (
            <>
              <Loader2 className="ppanel__spin" size={16} aria-hidden="true" />
              Generating…
            </>
          ) : (
            'Generate Image'
          )}
        </button>

        <button
          type="button"
          className="ppanel__apply"
          onClick={bake}
          disabled={!hasImage || !isEdited}
          title={
            isEdited
              ? 'Flatten the current edits into the image'
              : 'Make an edit first — there is nothing to apply'
          }
        >
          Apply Edits
        </button>
      </div>

      {/* Opened by the buttons above, never reached directly — `tabIndex={-1}`
          keeps them out of the tab order (`.sr-only` alone does not), and the
          label is there for anything that still surfaces them. */}
      <input
        ref={imgRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload a reference image"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onAddRef({ type: 'image', name: f.name })
          e.target.value = ''
        }}
      />
      <input
        ref={pdfRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload a reference PDF"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onAddRef({ type: 'pdf', name: f.name })
          e.target.value = ''
        }}
      />
    </section>
  )
}
