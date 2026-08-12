import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CircleX, Contrast, Crop, Droplet, RotateCw, SlidersHorizontal, Sun, WandSparkles } from 'lucide-react'
import { editTools } from '../config'
import { useStudio } from '../StudioProvider'
import ToolPopover from './ToolPopover'
import './EditToolbar.css'

/**
 * `config.js` names icons as strings so it can stay plain data — the reducer
 * and the renderer import it, and neither has any business pulling in React.
 * The mapping to actual glyphs belongs here, where lucide is already loaded.
 */
const ICONS = {
  crop: Crop,
  rotate: RotateCw,
  sun: Sun,
  contrast: Contrast,
  droplet: Droplet,
  filters: SlidersHorizontal,
  blur: CircleX,
  sharpen: WandSparkles,
}

/**
 * The tool strip beneath the canvas, and the popover it opens.
 *
 * Controls surface *above the button you pressed* rather than in a side panel,
 * which is what lets the canvas keep the full width of the card. The popover is
 * anchored by measuring the trigger's offset within the strip, so it stays over
 * its button as the row wraps or the window resizes — no fixed positions, no
 * per-tool offsets.
 *
 * Crop is the odd one out: it changes what the stage is doing rather than
 * opening controls, so it is a pressed toggle with no popover.
 */
/** Popover widths. Owned here, not in CSS, because the clamp below needs them. */
const WIDTH = { default: 268, presets: 320 }

export default function EditToolbar({ activeTool, onSelectTool }) {
  const { hasImage } = useStudio()
  const [place, setPlace] = useState({ width: WIDTH.default, left: 0, arrow: 0 })

  const stripRef = useRef(null)
  const wrapRef = useRef(null)
  const buttonRefs = useRef({})

  const tool = editTools.find((t) => t.id === activeTool) ?? null
  const popoverOpen = Boolean(tool && !tool.mode)

  /**
   * Place the popover over its trigger.
   *
   * Both the box and its arrow are solved here rather than in CSS, because the
   * two need the same numbers measured against *different* boxes — the box is
   * offset within the strip, the arrow within the box. Doing it in one place
   * with real pixels avoids that mismatch entirely.
   *
   * Layout effect so it lands positioned in the frame it appears in; a paint at
   * the wrong offset reads as a jump.
   */
  useLayoutEffect(() => {
    if (!popoverOpen) return

    const measure = () => {
      const btn = buttonRefs.current[activeTool]
      const strip = stripRef.current
      if (!btn || !strip) return

      const stripW = strip.clientWidth
      const width = Math.min(tool.presets ? WIDTH.presets : WIDTH.default, stripW)
      const half = width / 2
      const centre = btn.offsetLeft + btn.offsetWidth / 2
      // Pin to the card's edges so the first and last tools cannot push the box
      // outside it.
      const left = Math.max(half, Math.min(centre, stripW - half))

      setPlace({ width, left, arrow: centre - (left - half) })
    }

    measure()
    const ro = new ResizeObserver(measure)
    if (stripRef.current) ro.observe(stripRef.current)
    return () => ro.disconnect()
  }, [popoverOpen, activeTool, tool])

  // Clicking anywhere outside the strip dismisses the popover. Pointerdown
  // rather than click, so it closes on press like every other menu.
  useEffect(() => {
    if (!popoverOpen) return
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) onSelectTool(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [popoverOpen, onSelectTool])

  const closeAndRestore = () => {
    const btn = buttonRefs.current[activeTool]
    onSelectTool(null)
    btn?.focus()
  }

  /** Arrow keys walk the strip, as a toolbar should. */
  const onKeyDown = (e) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const items = editTools
      .map((t) => buttonRefs.current[t.id])
      .filter((el) => el && !el.disabled)
    if (!items.length) return
    e.preventDefault()

    const index = items.indexOf(document.activeElement)
    let next
    if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else if (index < 0) next = 0
    else next = (index + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length

    items[next].focus()
  }

  // Roving tabindex: the strip is one tab stop, not eight.
  const tabbableId = editTools.find((t) => t.id === activeTool)?.id ?? editTools[0].id

  return (
    <div className="etools" ref={wrapRef}>
      {popoverOpen && <ToolPopover tool={tool} place={place} onClose={closeAndRestore} />}

      <div
        className="etools__strip"
        role="toolbar"
        aria-label="Editing tools"
        ref={stripRef}
        onKeyDown={onKeyDown}
      >
        {editTools.map((t) => {
          const Icon = ICONS[t.icon]
          const isOn = activeTool === t.id
          return (
            <button
              key={t.id}
              type="button"
              ref={(el) => {
                buttonRefs.current[t.id] = el
              }}
              className={`etools__tool${isOn ? ' is-active' : ''}`}
              disabled={!hasImage}
              tabIndex={t.id === tabbableId ? 0 : -1}
              // Crop switches the stage into crop mode; the rest open a dialog.
              {...(t.mode
                ? { 'aria-pressed': isOn }
                : { 'aria-haspopup': 'dialog', 'aria-expanded': isOn })}
              onClick={() => onSelectTool(isOn ? null : t.id)}
            >
              <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
              <span className="etools__label">{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
