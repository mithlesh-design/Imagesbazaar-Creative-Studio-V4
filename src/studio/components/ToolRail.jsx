import { useRef } from 'react'
import {
  Crop,
  Palette,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UsersRound,
} from 'lucide-react'
import { toolGroups } from '../config'
import { useStudio } from '../StudioProvider'
import './ToolRail.css'

const ICONS = {
  crop: Crop,
  light: Sun,
  colour: Palette,
  filters: SlidersHorizontal,
  detail: Sparkles,
  rotate: RotateCw,
  characters: UsersRound,
}

/**
 * The left column: one entry per tool, and nothing else.
 *
 * Characters used to live below the tools as a permanent list, which meant the
 * rail carried two unrelated jobs and the roster took vertical space whether or
 * not you were using it. It is a tool now — it opens in the panel beside this
 * one, like every other tool, and gets room for search and filters there.
 *
 * A real tablist paired with that panel, so the relationship is announced and
 * arrow keys move between tools.
 */
export default function ToolRail({ openTool, onSelectTool, attachedCount }) {
  const { hasImage } = useStudio()
  const railRef = useRef(null)

  const onKeyDown = (e) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const index = toolGroups.findIndex((g) => g.id === openTool)
    let next
    if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = toolGroups.length - 1
    else if (index < 0) next = 0
    else next = (index + (e.key === 'ArrowDown' ? 1 : -1) + toolGroups.length) % toolGroups.length

    onSelectTool(toolGroups[next].id)
    railRef.current?.querySelectorAll('.trail__tool')[next]?.focus()
  }

  return (
    <div
      className="trail"
      role="tablist"
      aria-orientation="vertical"
      aria-label="Editing tools"
      ref={railRef}
      onKeyDown={onKeyDown}
    >
      {toolGroups.map((g) => {
        const Icon = ICONS[g.id]
        const selected = openTool === g.id
        const badge = g.id === 'characters' && attachedCount > 0 ? attachedCount : null
        return (
          <button
            key={g.id}
            type="button"
            role="tab"
            id={`tab-${g.id}`}
            aria-selected={selected}
            aria-controls="studio-tool-panel"
            tabIndex={selected ? 0 : -1}
            className={`trail__tool${selected ? ' is-active' : ''}${g.detached ? ' is-detached' : ''}`}
            /* The count goes in the label rather than a visually-hidden span —
               `.sr-only` is absolutely positioned, and an absolutely positioned
               child whose containing block sits outside its scroller escapes
               clipping and can stretch the document. */
            aria-label={badge ? `${g.label}, ${badge} attached` : undefined}
            onClick={() => onSelectTool(g.id)}
            disabled={!hasImage && !g.characters}
          >
            <span className="trail__icon">
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              {badge && (
                <span className="trail__badge" aria-hidden="true">
                  {badge}
                </span>
              )}
            </span>
            <span className="trail__label">{g.label}</span>
          </button>
        )
      })}
    </div>
  )
}
