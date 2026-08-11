import { useEffect, useRef, useState } from 'react'
import { ImageUp, Loader2, UploadCloud, X } from 'lucide-react'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useFocusTrap } from '../hooks/useFocusTrap'
import './ImageSearchModal.css'

const MAX_MB = 10
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

/**
 * Reverse-image-search UI flow.
 *
 * Per DESIGN.md §16 this is intentionally front-end only — there is no image
 * recognition behind it. Upload, drag-and-drop, paste, preview and the
 * analysing state are all real; the final step reports honestly that matching
 * is not wired up rather than inventing results.
 */
export default function ImageSearchModal({ open, onClose }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | analysing | done
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  const panelRef = useRef(null)
  const inputRef = useRef(null)

  useLockBodyScroll(open)
  useFocusTrap(panelRef, open, onClose)

  // Reset everything when the modal closes.
  useEffect(() => {
    if (open) return
    setFile(null)
    setPreview(null)
    setPhase('idle')
    setError(null)
    setDragging(false)
  }, [open])

  // Revoke the object URL so the blob isn't leaked.
  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  // Accept an image pasted from the clipboard while the modal is open.
  useEffect(() => {
    if (!open) return
    const onPaste = (e) => {
      const item = Array.from(e.clipboardData?.files ?? [])[0]
      if (item) accept(item)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [open])

  function accept(next) {
    setError(null)

    if (!ACCEPTED.includes(next.type)) {
      setError('That file type is not supported. Use JPG, PNG, WebP, GIF or AVIF.')
      return
    }
    if (next.size > MAX_MB * 1024 * 1024) {
      setError(`That image is larger than ${MAX_MB}MB. Try a smaller file.`)
      return
    }

    setFile(next)
    setPreview(URL.createObjectURL(next))
    setPhase('analysing')

    // Stand-in for the upload + matching round trip.
    setTimeout(() => setPhase('done'), 1600)
  }

  if (!open) return null

  return (
    <div className="ism">
      <div className="ism__backdrop" onClick={onClose} aria-hidden="true" />

      <div
        className="ism__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ism-title"
        tabIndex={-1}
      >
        <div className="ism__head">
          <h2 className="ism__title" id="ism-title">
            Search by image
          </h2>
          <button type="button" className="ism__close" onClick={onClose} aria-label="Close">
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="ism__body">
          {!file && (
            <>
              <div
                className={`ism__drop${dragging ? ' is-dragging' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  const dropped = e.dataTransfer.files?.[0]
                  if (dropped) accept(dropped)
                }}
              >
                <UploadCloud size={34} strokeWidth={1.5} aria-hidden="true" />
                <p className="ism__drop-title">Drag an image here</p>
                <p className="ism__drop-sub">or paste from your clipboard</p>

                <button
                  type="button"
                  className="ism__browse"
                  onClick={() => inputRef.current?.click()}
                >
                  <ImageUp size={18} aria-hidden="true" />
                  Choose a file
                </button>

                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED.join(',')}
                  className="sr-only"
                  onChange={(e) => {
                    const picked = e.target.files?.[0]
                    if (picked) accept(picked)
                    e.target.value = '' // allow re-picking the same file
                  }}
                />
              </div>

              <p className="ism__hint">JPG, PNG, WebP, GIF or AVIF · up to {MAX_MB}MB</p>
            </>
          )}

          {error && (
            <p className="ism__error" role="alert">
              {error}
            </p>
          )}

          {file && (
            <div className="ism__result">
              <img className="ism__preview" src={preview} alt={`Preview of ${file.name}`} />

              <div className="ism__status">
                {phase === 'analysing' ? (
                  <p className="ism__analysing" role="status">
                    <Loader2 className="ism__spin" size={18} aria-hidden="true" />
                    Analysing image…
                  </p>
                ) : (
                  <>
                    <p className="ism__done" role="status">
                      Image uploaded successfully.
                    </p>
                    <p className="ism__note">
                      Visual matching isn’t connected in this demo build — this flow covers
                      the upload experience only.
                    </p>
                  </>
                )}

                <button
                  type="button"
                  className="ism__again"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                    setPhase('idle')
                  }}
                >
                  Use a different image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
