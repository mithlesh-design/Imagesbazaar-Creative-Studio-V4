import { useRef, useState } from 'react'
import { FileText, ImagePlus, Link2, Loader2, Sparkles, X } from 'lucide-react'
import { characters } from '../../data/characters'
import { useStudio, useStudioActions } from '../StudioProvider'
import './PromptPanel.css'

const REF_ICON = { image: ImagePlus, pdf: FileText, link: Link2 }

const PROMPT_SUGGESTIONS = [
  '🪔 Add vibrant Diwali diyas & warm festive lighting',
  '🏢 Transform background to modern corporate office',
  '🌸 Decorate with traditional Indian marigold flowers',
  '🌆 Set cinematic Golden Hour Indian sunset lighting',
  '🎨 Apply rich Indian traditional heritage oil-painting style',
  '✨ Add celebratory color powder and festival mood',
]

export default function PromptPanel({
  prompt,
  onPromptChange,
  refs,
  onAddRef,
  onRemoveRef,
  selectedCharacters,
  onClearCharacters,
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

  const handleSuggestionClick = (suggestion) => {
    const cleanText = suggestion.replace(/^[^\w\s]+\s*/, '')
    onPromptChange(prompt ? `${prompt}, ${cleanText}` : cleanText)
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
      <div className="ppanel__head-row">
        <h2 className="ppanel__title" id="ppanel-heading">
          AI Prompt Studio
        </h2>
        <span className="ppanel__ai-tag">
          <Sparkles size={12} /> AI Powered
        </span>
      </div>

      <textarea
        className="ppanel__input"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Describe how you want to edit or generate the image..."
        aria-labelledby="ppanel-heading"
        rows={3}
      />

      {/* Prompt Suggestions */}
      <div className="ppanel__suggestions">
        <h3 className="ppanel__suggestions-title">
          <Sparkles size={13} aria-hidden="true" />
          Prompt Suggestions
        </h3>
        <div className="ppanel__suggestions-chips">
          {PROMPT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              className="ppanel__suggestion-chip"
              onClick={() => handleSuggestionClick(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

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

      <div className="ppanel__cta">
        <button
          type="button"
          className="ppanel__generate"
          onClick={handleGenerateClick}
          disabled={generating}
          title="Generate 10 image variations at once"
        >
          {generating ? (
            <>
              <Loader2 className="ppanel__spin" size={16} aria-hidden="true" />
              Generating 10 Variations…
            </>
          ) : (
            <>
              <Sparkles size={16} aria-hidden="true" />
              Generate 10 Variations ✨
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
          Apply Edits
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
