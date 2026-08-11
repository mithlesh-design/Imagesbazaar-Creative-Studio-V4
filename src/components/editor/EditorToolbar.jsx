import { useEffect, useRef } from 'react'
import {
  Contrast,
  Crop,
  Download,
  FlipHorizontal,
  Palette,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  Sun,
} from 'lucide-react'
import { aspectRatios, filterPresets, toolGroups } from '../../data/characters'
import './EditorToolbar.css'

const ICONS = {
  crop: Crop,
  light: Sun,
  colour: Palette,
  filters: SlidersHorizontal,
  detail: Sparkles,
  rotate: RotateCw,
}

export default function EditorToolbar({ editor, openTool, setOpenTool, onDownload }) {
  const {
    aspect, setAspect, adjustments, setAdjustment,
    offset, setOffset, rotate, flip, reset, isEdited, hasImage,
  } = editor

  const popRef = useRef(null)

  // Close the popover on outside click or Escape.
  useEffect(() => {
    if (!openTool) return
    const onDown = (e) => {
      if (!popRef.current?.contains(e.target) && !e.target.closest?.('.tb__tool')) {
        setOpenTool(null)
      }
    }
    const onKey = (e) => e.key === 'Escape' && setOpenTool(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openTool, setOpenTool])

  const group = toolGroups.find((g) => g.id === openTool)

  const valueOf = (key) =>
    key === 'offsetX' ? offset.x : key === 'offsetY' ? offset.y : adjustments[key]

  const change = (key, value) => {
    if (key === 'offsetX') setOffset({ ...offset, x: value })
    else if (key === 'offsetY') setOffset({ ...offset, y: value })
    else setAdjustment(key, value)
  }

  return (
    <div className="tb">
      <div className="tb__row">
        {/* Aspect ratio — 1:1 by default */}
        <div className="tb__ratios" role="group" aria-label="Aspect ratio">
          {aspectRatios.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`tb__ratio${aspect === r.id ? ' is-active' : ''}`}
              aria-pressed={aspect === r.id}
              onClick={() => setAspect(r.id)}
              disabled={!hasImage}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="tb__tools">
          {toolGroups.map((g) => {
            const Icon = ICONS[g.id]
            return (
              <button
                key={g.id}
                type="button"
                className={`tb__tool${openTool === g.id ? ' is-active' : ''}`}
                aria-pressed={openTool === g.id}
                aria-label={g.label}
                onClick={() => setOpenTool(openTool === g.id ? null : g.id)}
                disabled={!hasImage}
              >
                <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                <span className="tb__tool-label">{g.label}</span>
              </button>
            )
          })}

          <span className="tb__divider" aria-hidden="true" />

          <button
            type="button"
            className="tb__reset"
            onClick={reset}
            disabled={!hasImage || !isEdited}
            title="Undo all adjustments"
          >
            <RotateCcw size={16} aria-hidden="true" />
            <span className="tb__tool-label">Reset</span>
          </button>

          <button
            type="button"
            className="tb__download"
            onClick={onDownload}
            disabled={!hasImage}
          >
            <Download size={17} aria-hidden="true" />
            Download
          </button>
        </div>
      </div>

      {/* Tool popover */}
      {group && hasImage && (
        <div className="tb__pop" ref={popRef} role="group" aria-label={`${group.label} controls`}>
          {group.sliders?.map((s) => (
            <label className="tb__slider" key={s.key}>
              <span className="tb__slider-top">
                <span>{s.label}</span>
                <output>
                  {valueOf(s.key)}
                  {s.suffix ?? ''}
                </output>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={valueOf(s.key)}
                onChange={(e) => change(s.key, Number(e.target.value))}
                onDoubleClick={() => s.reset !== undefined && change(s.key, s.reset)}
              />
            </label>
          ))}

          {group.presets && (
            <div className="tb__presets">
              {filterPresets.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`tb__preset${adjustments.filter === f.id ? ' is-active' : ''}`}
                  aria-pressed={adjustments.filter === f.id}
                  onClick={() => setAdjustment('filter', f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {group.actions && (
            <div className="tb__actions">
              <button type="button" className="tb__action" onClick={rotate}>
                <RotateCw size={16} aria-hidden="true" />
                Rotate 90°
              </button>
              <button type="button" className="tb__action" onClick={flip}>
                <FlipHorizontal size={16} aria-hidden="true" />
                Flip
              </button>
            </div>
          )}

          {group.id === 'crop' && (
            <p className="tb__hint">
              <Contrast size={13} aria-hidden="true" />
              Pick a ratio on the left, then slide to choose what stays in frame.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
