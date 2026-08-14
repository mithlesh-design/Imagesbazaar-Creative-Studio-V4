import { useRef, useState } from 'react'
import { FileText, ImagePlus, Link2, Loader2, Plus, Sparkles, Users, X } from 'lucide-react'
import { characters } from '../../data/characters'
import { studioSuggestions } from '../../data/promptSuggestions'
import { useStudio, useStudioActions } from '../StudioProvider'
import './PromptPanel.css'

const REF_ICON = { image: ImagePlus, pdf: FileText, link: Link2 }

export default function PromptPanel({
  prompt,
  onPromptChange,
  refs,
  onAddRef,
  onRemoveRef,
  selectedCharacters,
  onClearCharacters,
  onOpenCharacters,
  onGenerate,
}) {
  const { hasImage, isEdited } = useStudio()
  const { bake } = useStudioActions()

  const [generating, setGenerating] = useState(false)

  const imgRef = useRef(null)
  const pdfRef = useRef(null)

  const names = selectedCharacters
    .map((id) => characters.find((c) => c.id === id)?.name)
    .filter(Boolean)

  const addLink = () => {
    const url = window.prompt('Paste a reference URL')
    if (!url?.trim()) return
    let name = url.trim()
    try {
      const u = new URL(name)
      name = u.hostname.replace(/^www\./, '') + u.pathname
    } catch {
      /* keep raw text as label */
    }
    onAddRef({ type: 'link', name })
  }

  const handleGenerateClick = () => {
    if (generating) return
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      onGenerate?.(prompt)
    }, 1200)
  }

  return (
    <section className="ppanel" aria-labelledby="ppanel-heading">
      <h2 className="sr-only" id="ppanel-heading">
        Prompt and references
      </h2>

      <div className="ppanel__scroll">
        <h3 className="ppanel__legend">Prompt</h3>
        <textarea
          className="ppanel__input"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe how you want to edit or generate the image…"
          aria-label="Prompt"
          /* Low on purpose: `rows` sets an intrinsic height that outranks
             `min-height`, so leaving it at 7 pinned the field at 191px and the
             short-viewport rule in the stylesheet could never take effect.
             Height is owned by CSS. */
          rows={2}
        />

        <h3 className="ppanel__legend">Suggestions</h3>
        <div className="ppanel__chips">
          {studioSuggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="ppanel__chip"
              onClick={() => onPromptChange(prompt ? `${prompt}, ${s.text}` : s.text)}
              /* The chip is a short label; the tooltip and accessible name
                 carry the instruction it will actually insert. */
              title={s.text}
              aria-label={s.text}
            >
              {s.label}
            </button>
          ))}
        </div>

        <h3 className="ppanel__legend">
          Characters
          <button
            type="button"
            className="ppanel__add"
            onClick={onOpenCharacters}
            aria-label="Choose characters"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </h3>
        {names.length > 0 ? (
          <div className="ppanel__chips">
            {names.map((name) => (
              <span className="ppanel__token" key={name}>
                <Users size={13} aria-hidden="true" />
                {name}
              </span>
            ))}
            <button type="button" className="ppanel__clear" onClick={onClearCharacters}>
              Clear
            </button>
          </div>
        ) : (
          <p className="ppanel__empty">None attached</p>
        )}

        <h3 className="ppanel__legend" id="ppanel-refs">
          References
        </h3>
        <div className="ppanel__adders" role="group" aria-labelledby="ppanel-refs">
          <button type="button" className="ppanel__adder" onClick={() => imgRef.current?.click()}>
            <ImagePlus size={16} strokeWidth={1.7} aria-hidden="true" />
            Image
          </button>
          <button type="button" className="ppanel__adder" onClick={addLink}>
            <Link2 size={16} strokeWidth={1.7} aria-hidden="true" />
            Link
          </button>
          <button type="button" className="ppanel__adder" onClick={() => pdfRef.current?.click()}>
            <FileText size={16} strokeWidth={1.7} aria-hidden="true" />
            PDF
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
          <p className="ppanel__empty">None added</p>
        )}
      </div>

      <div className="ppanel__cta">
        <button
          type="button"
          className="ppanel__generate"
          onClick={handleGenerateClick}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="ppanel__spin" size={16} aria-hidden="true" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={16} aria-hidden="true" />
              Generate 10 variations
            </>
          )}
        </button>

        <button
          type="button"
          className="ppanel__apply"
          onClick={bake}
          disabled={!hasImage || !isEdited}
          title={
            isEdited
              ? 'Flatten current edits into the image'
              : 'Make an edit first — there is nothing to apply'
          }
        >
          Apply edits
        </button>
      </div>

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
