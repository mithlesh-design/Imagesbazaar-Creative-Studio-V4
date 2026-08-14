import { useRef } from 'react'
import './ModeToggle.css'

export const MODES = [
  { id: 'search', label: 'Search' },
  { id: 'generate', label: 'Generate' },
]

/**
 * The primary mode switch. A `tablist` rather than a checkbox or a pair of
 * buttons, because it swaps the whole interface beneath it — which is what a
 * tab is. The sliding indicator is one element translated by the active index,
 * so the motion is a single transform rather than two elements cross-fading.
 */
export default function ModeToggle({ mode, onChange }) {
  const refs = useRef({})
  const index = MODES.findIndex((m) => m.id === mode)

  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = MODES[(index + step + MODES.length) % MODES.length]
    onChange(next.id)
    refs.current[next.id]?.focus()
  }

  return (
    <div
      className="modetoggle"
      role="tablist"
      aria-label="Search or generate"
      onKeyDown={onKeyDown}
    >
      <span
        className="modetoggle__indicator"
        style={{ transform: `translateX(${index * 100}%)` }}
        aria-hidden="true"
      />

      {MODES.map((m) => (
        <button
          key={m.id}
          ref={(el) => {
            refs.current[m.id] = el
          }}
          type="button"
          role="tab"
          id={`mode-${m.id}`}
          aria-selected={mode === m.id}
          aria-controls={`panel-${m.id}`}
          tabIndex={mode === m.id ? 0 : -1}
          className={`modetoggle__option${mode === m.id ? ' is-active' : ''}`}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
