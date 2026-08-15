import { forwardRef } from 'react'
import { ImageUp, Search } from 'lucide-react'
import './SiteSearch.css'

/**
 * The site-wide image search, sitting above the studio.
 *
 * There is no submit button by design — the reference this follows has none,
 * and a lone magnifier plus Enter is the convention for a bar of this shape.
 * `type="search"` gives the field its semantics; the platform's own clear
 * affordance is stripped in CSS so the bar looks identical across browsers.
 */
const SiteSearch = forwardRef(function SiteSearch(
  { value, onChange, onSubmit, onSearchByImage },
  ref
) {
  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (value.trim()) onSubmit()
  }

  return (
    <div className="sitesearch container">
      <div className="sitesearch__bar">
        <Search className="sitesearch__icon" size={26} strokeWidth={1.75} aria-hidden="true" />

        <input
          ref={ref}
          className="sitesearch__input"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search the largest collection of Indian images"
          aria-label="Search the largest collection of Indian images"
          autoComplete="off"
        />

        <span className="sitesearch__divider" aria-hidden="true" />

        <button
          type="button"
          className="sitesearch__byimage"
          onClick={onSearchByImage}
          aria-haspopup="dialog"
          /* The visible label is two lines of 11px type; the accessible name
             carries it verbatim so speech input can target what it reads. */
          aria-label="Search by image"
        >
          <ImageUp size={24} strokeWidth={1.6} aria-hidden="true" />
          <span>Search by image</span>
        </button>
      </div>
    </div>
  )
})

export default SiteSearch
