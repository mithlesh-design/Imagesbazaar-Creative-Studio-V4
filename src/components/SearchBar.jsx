import { forwardRef, useRef, useState } from 'react'
import { FileText, ImagePlus, Link2, Loader2, Sparkles, X } from 'lucide-react'
import './SearchBar.css'

const SearchBar = forwardRef(function SearchBar(
  { search, onSelectImage },
  ref
) {
  const { query, setQuery, status, generate } = search
  const [references, setReferences] = useState([])

  const imgInputRef = useRef(null)
  const pdfInputRef = useRef(null)

  const placeholder = 'Explain what kind of image you are looking for.'

  const handleAddLink = () => {
    const url = window.prompt('Enter reference link URL:')
    if (!url?.trim()) return
    let name = url.trim()
    try {
      const u = new URL(name)
      name = u.hostname.replace(/^www\./, '') + u.pathname
    } catch {
      /* raw text */
    }
    setReferences((prev) => [...prev, { id: Date.now(), type: 'link', name }])
  }

  const handleRemoveRef = (id) => {
    setReferences((prev) => prev.filter((r) => r.id !== id))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      generate()
    }
  }

  return (
    <div className="search-bar-wrap">
      <div className="search__bar">
        <div className="search__field">
          {/* Generate Icon */}
          <Sparkles className="search__icon search__icon--sparkle" size={24} strokeWidth={2} aria-hidden="true" />

          <input
            ref={ref}
            className="search__input"
            type="text"
            value={query}
            placeholder={placeholder}
            aria-label="Explain what kind of image you are looking for"
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {status === 'loading' && (
            <Loader2 className="search__spinner" size={20} aria-hidden="true" />
          )}

          {query && status !== 'loading' && (
            <div className="search__actions-right">
              <button
                type="button"
                className="search__clear"
                onClick={() => {
                  setQuery('')
                  ref?.current?.focus()
                }}
                aria-label="Clear prompt"
              >
                <X size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="search__generate-btn"
                onClick={generate}
              >
                Generate
              </button>
            </div>
          )}
        </div>

        {/* Three Reference Action Buttons */}
        <div className="search__ref-actions">
          <button
            type="button"
            className="search__ref-btn"
            onClick={handleAddLink}
            title="Add a reference website URL"
          >
            <Link2 size={16} strokeWidth={2} />
            <span>Add Link</span>
          </button>

          <button
            type="button"
            className="search__ref-btn"
            onClick={() => imgInputRef.current?.click()}
            title="Upload a reference photo"
          >
            <ImagePlus size={16} strokeWidth={2} />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            className="search__ref-btn"
            onClick={() => pdfInputRef.current?.click()}
            title="Upload a reference PDF document"
          >
            <FileText size={16} strokeWidth={2} />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            setReferences((prev) => [...prev, { id: Date.now(), type: 'image', name: file.name }])
          }
          e.target.value = ''
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            setReferences((prev) => [...prev, { id: Date.now(), type: 'pdf', name: file.name }])
          }
          e.target.value = ''
        }}
      />

      {/* Attached Reference Tags */}
      {references.length > 0 && (
        <div className="search__ref-tags">
          <span className="search__ref-title">References attached:</span>
          {references.map((r) => (
            <span key={r.id} className="search__ref-tag">
              {r.type === 'image' && <ImagePlus size={13} />}
              {r.type === 'link' && <Link2 size={13} />}
              {r.type === 'pdf' && <FileText size={13} />}
              <span className="search__ref-name">{r.name}</span>
              <button
                type="button"
                className="search__ref-remove"
                onClick={() => handleRemoveRef(r.id)}
                aria-label={`Remove reference ${r.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

export default SearchBar
