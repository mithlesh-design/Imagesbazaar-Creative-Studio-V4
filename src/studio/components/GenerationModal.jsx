import { useState } from 'react'
import { Check, Sparkles, X } from 'lucide-react'
import { useStudio, useStudioActions } from '../StudioProvider'
import './GenerationModal.css'

const VARIATIONS = [
  { id: 'v1', label: 'Diwali Festive Glow', filter: 'sepia(0.35) saturate(1.5) hue-rotate(-15deg) contrast(1.1)' },
  { id: 'v2', label: 'Cinematic Golden Hour', filter: 'contrast(1.15) saturate(1.4) brightness(1.05) sepia(0.2)' },
  { id: 'v3', label: 'Royal Heritage Classic', filter: 'contrast(1.2) saturate(0.85) sepia(0.4)' },
  { id: 'v4', label: 'Vibrant Colors', filter: 'saturate(1.8) contrast(1.1) brightness(1.02)' },
  { id: 'v5', label: 'Modern Corporate Studio', filter: 'saturate(1.1) hue-rotate(10deg) contrast(1.08)' },
  { id: 'v6', label: 'Soft Vintage Portrait', filter: 'sepia(0.4) contrast(0.95) brightness(1.08)' },
  { id: 'v7', label: 'Moody Cinematic Noir', filter: 'grayscale(0.6) contrast(1.3) brightness(0.95)' },
  { id: 'v8', label: 'Cool Studio Light', filter: 'hue-rotate(18deg) saturate(1.15) contrast(1.05)' },
  { id: 'v9', label: 'High Contrast Vivid', filter: 'contrast(1.35) saturate(1.4)' },
  { id: 'v10', label: 'Warm Sunset Atmosphere', filter: 'sepia(0.5) saturate(1.3) hue-rotate(-20deg)' },
]

export default function GenerationModal({ open, onClose, prompt, selectedCharacters }) {
  const { source, meta } = useStudio()
  const actions = useStudioActions()
  const [selectedIdx, setSelectedIdx] = useState(0)

  if (!open || !source) return null

  const handleSelectImage = (varItem) => {
    // Generate a baked canvas version for the selected variation
    const canvas = document.createElement('canvas')
    canvas.width = source.naturalWidth || source.width || 1200
    canvas.height = source.naturalHeight || source.height || 900
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.filter = varItem.filter
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'
    }

    // Load the generated variation onto the studio canvas
    actions.loadFromSource({
      url: canvas.toDataURL('image/jpeg', 0.92),
      name: `generated-${varItem.id}.jpg`,
      title: `${meta?.title || 'Generated Image'} (${varItem.label})`,
      alt: prompt || meta?.alt,
    })

    onClose()
  }

  return (
    <div className="gen-modal" role="presentation" onMouseDown={onClose}>
      <div
        className="gen-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gen-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="gen-modal__head">
          <div>
            <h2 className="gen-modal__title" id="gen-modal-title">
              <Sparkles size={20} className="gen-modal__sparkle" />
              10 Generated Image Variations
            </h2>
            <p className="gen-modal__sub">
              Prompt: {prompt ? `“${prompt}”` : 'AI Generated Variations'} — Select your preferred variation to load onto the canvas
            </p>
          </div>
          <button
            type="button"
            className="gen-modal__close"
            onClick={onClose}
            aria-label="Close generator modal"
          >
            <X size={20} />
          </button>
        </header>

        <div className="gen-modal__grid">
          {VARIATIONS.map((v, idx) => (
            <button
              key={v.id}
              type="button"
              className={`gen-card${selectedIdx === idx ? ' is-selected' : ''}`}
              onClick={() => {
                setSelectedIdx(idx)
                handleSelectImage(v)
              }}
            >
              <div className="gen-card__media">
                <img
                  src={source.src || source}
                  alt={v.label}
                  className="gen-card__img"
                  style={{ filter: v.filter }}
                />
                <span className="gen-card__num">#{idx + 1}</span>
                {selectedIdx === idx && (
                  <span className="gen-card__badge">
                    <Check size={14} strokeWidth={3} /> Selected
                  </span>
                )}
              </div>
              <span className="gen-card__label">{v.label}</span>
            </button>
          ))}
        </div>

        <footer className="gen-modal__foot">
          <p className="gen-modal__hint">
            Click any variation to immediately select and load it onto the studio canvas for fine-tuning.
          </p>
          <button type="button" className="gen-modal__done" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  )
}
