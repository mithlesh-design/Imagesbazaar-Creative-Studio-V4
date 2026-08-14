import { forwardRef } from 'react'
import { Image, Search } from 'lucide-react'
import './SearchPanel.css'

/**
 * The Search half of the hero. A single-line bar rather than the generate
 * mode's tall field: a search query is a phrase, not a brief, and a box sized
 * for paragraphs invites the wrong input.
 */
const SearchPanel = forwardRef(function SearchPanel(
  { value, onChange, onSubmit, onSearchByImage, busy = false },
  ref
) {
  const canSubmit = Boolean(value.trim()) && !busy

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (canSubmit) onSubmit()
  }

  return (
    <div className="searchpanel">
      <Search className="searchpanel__icon" size={20} aria-hidden="true" />

      <input
        ref={ref}
        className="searchpanel__input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search over 100,000 Indian images…"
        aria-label="Search over 100,000 Indian images"
        autoComplete="off"
      />

      <button
        type="button"
        className="searchpanel__byimage"
        onClick={onSearchByImage}
        aria-haspopup="dialog"
        /* Explicit, and containing the visible text verbatim: the label below
           640px is hidden with `display: none`, which removes it from the
           accessibility tree entirely. */
        aria-label="Search by image"
      >
        <Image size={16} aria-hidden="true" />
        <span>Search by image</span>
      </button>

      <button
        type="button"
        className="searchpanel__submit"
        onClick={onSubmit}
        disabled={!canSubmit}
      >
        Search
      </button>
    </div>
  )
})

export default SearchPanel
