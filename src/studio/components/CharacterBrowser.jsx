import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { characters, describeCharacter } from '../../data/characters'
import { characterFilters } from '../config'
import './CharacterBrowser.css'

/**
 * The full roster, opened from "View All Characters".
 *
 * This is where the panel's depth went. Search matches name, role and age band,
 * so "corporate", "30s" and "priya" all work — people look for a character by
 * whichever of those they remember. It runs alongside the filters rather than
 * replacing them: filters are for browsing, search is for when you already know
 * who you want.
 *
 * Selection is live. There is no Apply button because there is nothing to
 * apply — toggling a face here is the same action as toggling it in the panel,
 * and the count in the prompt updates as you go.
 */
export default function CharacterBrowser({ open, onClose, selected, onToggle, onClear }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const panelRef = useRef(null)
  const gridRef = useRef(null)
  const inputRef = useRef(null)

  useLockBodyScroll(open)
  useFocusTrap(panelRef, open, onClose)

  // A stale query is a confusing thing to reopen into.
  useEffect(() => {
    if (open) return
    setQuery('')
    setFilter('all')
  }, [open])

  const visible = useMemo(() => {
    const f = characterFilters.find((x) => x.id === filter) ?? characterFilters[0]
    const q = query.trim().toLowerCase()
    return characters.filter((c) => {
      if (!f.match(c)) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.age.toLowerCase().includes(q)
      )
    })
  }, [filter, query])

  /** Roving focus across the grid, as a list of options should have. */
  const onGridKeyDown = (e) => {
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const items = Array.from(gridRef.current?.querySelectorAll('.cbrowse__person') ?? [])
    if (!items.length) return
    e.preventDefault()

    // Column count is read from the layout rather than hard-coded, so arrow
    // navigation still matches what you see after the grid reflows.
    const perRow = Math.max(
      1,
      Math.round(gridRef.current.clientWidth / (items[0].offsetWidth || 1))
    )
    const index = items.indexOf(document.activeElement)
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: perRow, ArrowUp: -perRow }[e.key]

    let next
    if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else if (index < 0) next = 0
    else next = Math.min(items.length - 1, Math.max(0, index + step))

    items[next].focus()
  }

  if (!open) return null

  return (
    <div className="cbrowse" role="presentation" onMouseDown={onClose}>
      <div
        className="cbrowse__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cbrowse-title"
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="cbrowse__head">
          <div>
            <h2 className="cbrowse__title" id="cbrowse-title">
              All characters
            </h2>
            <p className="cbrowse__sub">
              Attached characters are sent with your prompt.
            </p>
          </div>
          <button
            type="button"
            className="cbrowse__close"
            onClick={onClose}
            aria-label="Close character browser"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="cbrowse__search">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className="cbrowse__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Escape clears the field first; only an empty field closes.
              if (e.key === 'Escape' && query) {
                e.stopPropagation()
                setQuery('')
              }
            }}
            placeholder="Search name, role or age"
            aria-label="Search characters by name, role or age"
          />
          {query && (
            <button
              type="button"
              className="cbrowse__clear"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="cbrowse__filters" role="radiogroup" aria-label="Filter characters">
          {characterFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filter === f.id}
              className={`cbrowse__chip${filter === f.id ? ' is-active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          className="cbrowse__grid"
          role="group"
          aria-label={`${visible.length} characters${
            selected.length ? `, ${selected.length} attached` : ''
          }`}
          ref={gridRef}
          onKeyDown={onGridKeyDown}
        >
          {visible.map((c) => {
            const isOn = selected.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                className={`cbrowse__person${isOn ? ' is-selected' : ''}`}
                aria-pressed={isOn}
                aria-label={`${c.name}, ${describeCharacter(c)}`}
                onClick={() => onToggle(c.id)}
              >
                <span className="cbrowse__avatar" aria-hidden="true">
                  {c.name.charAt(0)}
                  {isOn && (
                    <span className="cbrowse__tick">
                      <Check size={11} strokeWidth={3.2} />
                    </span>
                  )}
                </span>
                <span className="cbrowse__text" aria-hidden="true">
                  <span className="cbrowse__name">{c.name}</span>
                  <span className="cbrowse__role">{describeCharacter(c)}</span>
                </span>
              </button>
            )
          })}

          {visible.length === 0 && (
            <p className="cbrowse__none">No character matches “{query || filter}”.</p>
          )}
        </div>

        <footer className="cbrowse__foot">
          <span className="cbrowse__count">
            {selected.length
              ? `${selected.length} attached`
              : 'None attached yet'}
          </span>
          <div className="cbrowse__foot-actions">
            <button
              type="button"
              className="cbrowse__ghost"
              onClick={onClear}
              disabled={!selected.length}
            >
              Clear all
            </button>
            <button type="button" className="cbrowse__done" onClick={onClose}>
              Done
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
