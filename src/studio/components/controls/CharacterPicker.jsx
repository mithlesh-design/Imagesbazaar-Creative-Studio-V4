import { useMemo, useRef, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { characters, describeCharacter } from '../../../data/characters'
import { characterFilters } from '../../config'
import './CharacterPicker.css'

/**
 * The Characters tool's panel: search, filter, pick.
 *
 * Search matches name, role and age band, so "corporate", "30s" and "priya" all
 * work — people look for a character by whichever of those they remember. It
 * runs alongside the filters rather than replacing them: filters are for
 * browsing, search is for when you already know who you want.
 *
 * Avatars are initials, never invented likenesses, each with its own hue so a
 * list of twelve stays scannable.
 */
export default function CharacterPicker({ selected, onToggle, onClear }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const listRef = useRef(null)
  const inputRef = useRef(null)

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

  /** Roving focus down the results, as a list of options should have. */
  const onKeyDown = (e) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const items = Array.from(listRef.current?.querySelectorAll('.cpick__person') ?? [])
    if (!items.length) return
    e.preventDefault()
    const index = items.indexOf(document.activeElement)
    let next
    if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else if (index < 0) next = 0
    else next = (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[next].focus()
  }

  return (
    <div className="cpick">
      <div className="cpick__search">
        <Search size={14} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className="cpick__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && query) {
              e.stopPropagation() // don't let Escape also leave full screen
              setQuery('')
            }
          }}
          placeholder="Search name or role"
          aria-label="Search characters by name, role or age"
        />
        {query && (
          <button
            type="button"
            className="cpick__clear"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="cpick__filters" role="radiogroup" aria-label="Filter characters">
        {characterFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={filter === f.id}
            className={`cpick__chip${filter === f.id ? ' is-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        className="cpick__list"
        role="group"
        aria-label={`${visible.length} characters${selected.length ? `, ${selected.length} selected` : ''}`}
        ref={listRef}
        onKeyDown={onKeyDown}
      >
        {visible.map((c) => {
          const isOn = selected.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              className={`cpick__person${isOn ? ' is-selected' : ''}`}
              aria-pressed={isOn}
              aria-label={`${c.name}, ${describeCharacter(c)}`}
              onClick={() => onToggle(c.id)}
            >
              <span className="cpick__avatar" style={{ '--hue': c.hue }} aria-hidden="true">
                {c.name.charAt(0)}
              </span>
              <span className="cpick__text" aria-hidden="true">
                <span className="cpick__name">{c.name}</span>
                <span className="cpick__role">{describeCharacter(c)}</span>
              </span>
              {isOn && (
                <span className="cpick__tick" aria-hidden="true">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}

        {visible.length === 0 && (
          <p className="cpick__none">
            No character matches “{query || filter}”.
          </p>
        )}
      </div>

      {selected.length > 0 && (
        <div className="cpick__foot">
          <span>
            {selected.length} attached
          </span>
          <button type="button" onClick={onClear}>
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
