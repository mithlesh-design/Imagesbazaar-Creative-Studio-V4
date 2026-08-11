import { useId, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import './Slider.css'

/**
 * An adjustment slider with a typed value and a fill that grows *from the
 * default*, not from the left edge.
 *
 * That last detail is the point of the component. Exposure and Warmth run
 * −100…100 with a neutral middle; a conventional left-anchored fill makes
 * "neutral" look like "half applied". Filling outward from the default means
 * an untouched slider shows no fill at all, and how far you have pushed it is
 * readable at a glance without reading the number.
 */
export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  reset,
  onChange,
  onBegin,
  onCommit,
  disabled = false,
}) {
  const id = useId()
  const [typed, setTyped] = useState(null) // local text while the field is focused

  const origin = reset ?? min
  const pct = (v) => ((v - min) / (max - min)) * 100
  const from = Math.min(pct(origin), pct(value))
  const to = Math.max(pct(origin), pct(value))
  const isDefault = value === origin

  const commitTyped = () => {
    if (typed === null) return
    const parsed = Number(typed)
    setTyped(null)
    if (Number.isNaN(parsed)) return
    const clamped = Math.min(max, Math.max(min, parsed))
    if (clamped === value) return
    onBegin?.()
    onChange(clamped)
    onCommit?.()
  }

  const resetToDefault = () => {
    if (isDefault) return
    onBegin?.()
    onChange(origin)
    onCommit?.()
  }

  return (
    <div className={`sld${disabled ? ' is-disabled' : ''}`}>
      <div className="sld__top">
        <label className="sld__label" htmlFor={id}>
          {label}
        </label>

        <div className="sld__value">
          <input
            className="sld__number"
            type="number"
            inputMode="numeric"
            value={typed ?? value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-label={`${label} value`}
            onChange={(e) => setTyped(e.target.value)}
            onBlur={commitTyped}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
          />
          {suffix && <span className="sld__suffix">{suffix}</span>}

          <button
            type="button"
            className="sld__reset"
            onClick={resetToDefault}
            disabled={disabled || isDefault}
            aria-label={`Reset ${label} to ${origin}${suffix}`}
            title={`Reset ${label}`}
          >
            <RotateCcw size={12} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="sld__track-wrap">
        <input
          id={id}
          className="sld__range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={`${value}${suffix}`}
          style={{ '--fill-from': `${from}%`, '--fill-to': `${to}%` }}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={onBegin}
          onPointerUp={onCommit}
          onKeyDown={onBegin}
          onKeyUp={onCommit}
          onDoubleClick={resetToDefault}
        />
        {/* The origin tick sits under the thumb so "neutral" has a landmark. */}
        <span className="sld__origin" style={{ left: `${pct(origin)}%` }} aria-hidden="true" />
      </div>
    </div>
  )
}
