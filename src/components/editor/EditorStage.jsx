import { useRef, useState } from 'react'
import { Image as ImageIcon, Loader2, Search, Upload, X } from 'lucide-react'
import './EditorStage.css'

export default function EditorStage({ editor, onFocusSearch }) {
  const { canvasRef, hasImage, loading, meta, error, loadFile, clear } = editor
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  return (
    <div
      className={`stage${dragging ? ' is-dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        loadFile(e.dataTransfer.files?.[0])
      }}
    >
      <canvas
        ref={canvasRef}
        className="stage__canvas"
        style={{ display: hasImage ? 'block' : 'none' }}
        aria-label={hasImage ? meta?.alt || 'Image being edited' : undefined}
      />

      {loading && (
        <div className="stage__loading" role="status">
          <Loader2 className="stage__spin" size={24} aria-hidden="true" />
          Opening image…
        </div>
      )}

      {!hasImage && !loading && (
        <div className="stage__empty">
          <span className="stage__empty-icon" aria-hidden="true">
            <ImageIcon size={30} strokeWidth={1.4} />
          </span>
          <p className="stage__empty-title">Search and select an image to start editing</p>
          <p className="stage__empty-sub">
            Pick any photo from the search above or the collections below.
          </p>

          <div className="stage__empty-actions">
            <button type="button" className="stage__cta" onClick={onFocusSearch}>
              <Search size={17} aria-hidden="true" />
              Search images
            </button>
            <button
              type="button"
              className="stage__ghost"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} aria-hidden="true" />
              Upload your own
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              loadFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      )}

      {hasImage && (
        <div className="stage__meta">
          <span className="stage__name">{meta?.title || meta?.name}</span>
          <button type="button" onClick={clear} aria-label="Remove image" title="Remove image">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <p className="stage__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
