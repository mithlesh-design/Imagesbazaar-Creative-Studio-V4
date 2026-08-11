import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, ImageUp, Loader2, Search, X } from 'lucide-react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import './SearchBar.css'

/**
 * The page's primary interaction.
 *
 * A combobox whose options are the images themselves — choosing one opens it
 * in the Creative Editor below. Arrow keys move a virtual cursor over the
 * results without taking DOM focus off the input.
 */
const SearchBar = forwardRef(function SearchBar(
  { search, onOpenImageSearch, onSelectImage },
  ref
) {
  const { query, setQuery, status, results, retry } = search

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const rootRef = useRef(null)
  const listId = useId()

  // The full sentence is clipped on narrow screens, so shorten it there.
  // The accessible name stays constant either way.
  const isNarrow = useMediaQuery('(max-width: 639px)')
  const placeholder = isNarrow
    ? 'Search Indian images'
    : 'Search the world’s largest collection of Indian images'

  const showPanel =
    open &&
    (status === 'loading' || status === 'results' || status === 'empty' || status === 'error')

  // Reset the highlighted row whenever the result set changes.
  useEffect(() => setActive(-1), [results, status])

  // Close on outside click.
  useEffect(() => {
    if (!showPanel) return
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showPanel])

  const choose = (item) => {
    if (!item) return
    setOpen(false)
    onSelectImage?.(item.collection)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      // No row highlighted? Take the top match — pressing Enter should do
      // something useful rather than nothing.
      choose(active >= 0 ? results[active] : results[0])
      return
    }
    if (!results.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
    }
  }

  return (
    <div className="search" ref={rootRef}>
      <div
        className={`search__bar${showPanel ? ' search__bar--open' : ''}${
          status === 'error' ? ' search__bar--error' : ''
        }`}
      >
        <div className="search__field">
          <Search className="search__icon" size={26} strokeWidth={2} aria-hidden="true" />

          <input
            ref={ref}
            className="search__input"
            type="text"
            value={query}
            placeholder={placeholder}
            aria-label="Search Indian images"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              active >= 0 && results[active] ? `${listId}-opt-${active}` : undefined
            }
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />

          {status === 'loading' && (
            <Loader2 className="search__spinner" size={20} aria-hidden="true" />
          )}

          {query && status !== 'loading' && (
            <button
              type="button"
              className="search__clear"
              onClick={() => {
                setQuery('')
                setOpen(false)
                ref?.current?.focus()
              }}
              aria-label="Clear search"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="button"
          className="search__image"
          onClick={onOpenImageSearch}
          aria-label="Search by image"
          title="Upload an image to search with it"
        >
          <ImageUp size={22} strokeWidth={1.8} aria-hidden="true" />
          <span className="search__image-label">Search By Image</span>
        </button>
      </div>

      {showPanel && (
        <div className="search__panel" role="presentation">
          {status === 'loading' && (
            <p className="search__note" role="status">
              Searching…
            </p>
          )}

          {status === 'error' && (
            <div className="search__note search__note--error" role="alert">
              <AlertCircle size={17} aria-hidden="true" />
              <span>Something went wrong with that search.</span>
              <button type="button" className="search__retry" onClick={retry}>
                Try again
              </button>
            </div>
          )}

          {status === 'empty' && (
            <p className="search__note" role="status">
              No images match “{query.trim()}”. Try a broader term such as{' '}
              <em>family</em> or <em>festival</em>.
            </p>
          )}

          {status === 'results' && (
            <>
              <p className="search__hint" id={`${listId}-hint`}>
                Select an image to open it in the Creative Editor
              </p>
              <ul
                className="search__results"
                id={listId}
                role="listbox"
                aria-label="Matching images"
              >
                {results.map((item, i) => (
                  <li key={item.id} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className={`search__result${i === active ? ' is-active' : ''}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(item)}
                    >
                      <img
                        className="search__thumb"
                        src={item.image}
                        alt=""
                        width={64}
                        height={48}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="search__result-text">
                        <span className="search__result-label">{item.label}</span>
                        <span className="search__result-alt">{item.alt}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
})

export default SearchBar
