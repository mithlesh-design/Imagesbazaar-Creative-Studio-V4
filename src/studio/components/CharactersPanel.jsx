import { useMemo } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { characters, describeCharacter } from '../../data/characters'
import './CharactersPanel.css'

/** How many faces the panel shows before you have to open the full browser. */
const VISIBLE = 6

const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
]

/**
 * The left card: pick who appears in the generated image.
 *
 * Deliberately the shallow end. Gender narrows the list, six faces fit without
 * scrolling, and anything more specific — searching by name, filtering by role
 * — lives behind "View All Characters". A panel you can read at a glance beats
 * one that can answer every question, because choosing a face is the first
 * thing you do here and not the thing you spend time on.
 *
 * Avatars are initials, never invented likenesses. Selection reads as a filled
 * disc *and* a tick, so it survives being printed, dimmed, or seen by someone
 * who cannot separate the two fills by colour.
 */
export default function CharactersPanel({
  gender,
  onGenderChange,
  selected,
  onToggle,
  onOpenBrowser,
}) {
  const visible = useMemo(
    () => characters.filter((c) => c.gender === gender).slice(0, VISIBLE),
    [gender]
  )

  // Someone picked in the browser, then filtered away, is still attached — say
  // so, or the count in the prompt panel looks like it came from nowhere.
  const hiddenCount = selected.filter(
    (id) => !visible.some((c) => c.id === id)
  ).length

  return (
    <section className="cpanel" aria-labelledby="cpanel-heading">
      <header className="cpanel__head">
        <h2 className="cpanel__title" id="cpanel-heading">
          Characters
        </h2>
        <p className="cpanel__sub">Choose ImagesBazaar character</p>
      </header>

      <div className="cpanel__toggle" role="radiogroup" aria-label="Filter characters by gender">
        {GENDERS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={gender === g.id}
            className={`cpanel__seg${gender === g.id ? ' is-active' : ''}`}
            onClick={() => onGenderChange(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="cpanel__grid" role="group" aria-label="ImagesBazaar characters">
        {visible.map((c) => {
          const isOn = selected.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              className={`cpanel__person${isOn ? ' is-selected' : ''}`}
              aria-pressed={isOn}
              aria-label={`${c.name}, ${describeCharacter(c)}`}
              onClick={() => onToggle(c.id)}
            >
              <span className="cpanel__avatar" aria-hidden="true">
                {c.name.charAt(0)}
                {isOn && (
                  <span className="cpanel__tick">
                    <Check size={11} strokeWidth={3.2} />
                  </span>
                )}
              </span>
              <span className="cpanel__name" aria-hidden="true">
                {c.name}
              </span>
            </button>
          )
        })}
      </div>

      <div className="cpanel__foot">
        {hiddenCount > 0 && (
          <p className="cpanel__note" role="status">
            {hiddenCount} more attached from other filters
          </p>
        )}
        <button type="button" className="cpanel__all" onClick={onOpenBrowser}>
          View All Characters
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
