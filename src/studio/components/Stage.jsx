import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image as ImageIcon, Loader2, Search, Upload, X } from 'lucide-react'
import { useStudio, useStudioActions } from '../StudioProvider'
import { useRenderLoop } from '../useRenderLoop'
import { clamp } from '../cropMath'
import CropOverlay from './CropOverlay'
import './Stage.css'

/**
 * Safety margin for the frame's drop shadow only.
 *
 * The visible breathing room around the picture is CSS padding on
 * `.sstage__area`, and `contentRect` already excludes it — so anything more
 * than a hairline here is padding counted twice, shrinking the picture for no
 * visible reason.
 */
const MAT_PAD = 6

export default function Stage({ cropping = false, onFitScale, onFocusSearch }) {
  const { baseRef, baseVersion, baseSize, edit, comparing, hasImage, loading, error, meta, view } =
    useStudio()
  const a = useStudioActions()

  const areaRef = useRef(null)
  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const [area, setArea] = useState({ w: 0, h: 0 })
  const [dragging, setDragging] = useState(false)

  /**
   * While cropping you need to see what you are cutting away, so the stage
   * renders the whole frame and the overlay draws the crop on top. Every other
   * tool renders the cropped result, because that is the picture you are
   * actually judging.
   */
  const renderCrop = useMemo(
    () => (cropping ? { x: 0, y: 0, w: baseSize.w, h: baseSize.h } : edit.crop),
    [cropping, baseSize.w, baseSize.h, edit.crop]
  )

  // Measure the picture's own area rather than the panel's. The toolbar and the
  // top bar are siblings outside this box, so their height is already excluded
  // from what the image is fitted into.
  useEffect(() => {
    const node = areaRef.current
    if (!node) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setArea({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const availW = Math.max(1, area.w - MAT_PAD * 2)
  const availH = Math.max(1, area.h - MAT_PAD * 2)

  const fitScale = useMemo(() => {
    if (!renderCrop.w || !renderCrop.h) return 1
    return Math.min(availW / renderCrop.w, availH / renderCrop.h)
  }, [availW, availH, renderCrop.w, renderCrop.h])

  useEffect(() => {
    onFitScale?.(fitScale)
  }, [fitScale, onFitScale])

  const scale = view.fit ? fitScale : view.zoom
  const dispW = Math.max(1, Math.round(renderCrop.w * scale))
  const dispH = Math.max(1, Math.round(renderCrop.h * scale))

  // Pan only has meaning once the picture is larger than the window onto it.
  const maxPanX = Math.max(0, (dispW - availW) / 2)
  const maxPanY = Math.max(0, (dispH - availH) / 2)
  const panX = clamp(view.panX, -maxPanX, maxPanX)
  const panY = clamp(view.panY, -maxPanY, maxPanY)
  const canPan = !cropping && (maxPanX > 0 || maxPanY > 0)

  useRenderLoop({
    canvasRef,
    baseRef,
    baseVersion,
    crop: renderCrop,
    adjustments: edit.adjustments,
    comparing,
    displayW: dispW,
    displayH: dispH,
  })

  /** ctrl/⌘ + wheel, and trackpad pinch, zoom about the centre. */
  const onWheel = useCallback(
    (e) => {
      if (!hasImage) return
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const current = view.fit ? fitScale : view.zoom
      a.setZoom(current * (e.deltaY < 0 ? 1.12 : 1 / 1.12))
    },
    [a, hasImage, view.fit, view.zoom, fitScale]
  )

  const startPan = useCallback(
    (e) => {
      if (!canPan || e.button !== 0) return
      const originX = panX
      const originY = panY
      const startX = e.clientX
      const startY = e.clientY
      const node = e.currentTarget
      node.setPointerCapture(e.pointerId)

      const move = (ev) => {
        a.setPan(
          clamp(originX + (ev.clientX - startX), -maxPanX, maxPanX),
          clamp(originY + (ev.clientY - startY), -maxPanY, maxPanY)
        )
      }
      const end = () => {
        node.removeEventListener('pointermove', move)
        node.removeEventListener('pointerup', end)
        node.removeEventListener('pointercancel', end)
      }
      node.addEventListener('pointermove', move)
      node.addEventListener('pointerup', end)
      node.addEventListener('pointercancel', end)
    },
    [a, canPan, panX, panY, maxPanX, maxPanY]
  )

  return (
    <div
      className={`sstage${dragging ? ' is-dragging' : ''}${hasImage ? ' has-image' : ''}`}
      /* Capture phase, so focus lands even when the crop overlay stops the
         event — that is what arms the keyboard shortcuts for this section. */
      onPointerDownCapture={(e) => {
        if (!e.currentTarget.contains(document.activeElement)) e.currentTarget.focus()
      }}
      tabIndex={-1}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        a.loadFile(e.dataTransfer.files?.[0])
      }}
      onWheel={onWheel}
    >
      <div className="sstage__area" ref={areaRef}>
        {hasImage && (
          <div
            className={`sstage__frame${canPan ? ' can-pan' : ''}`}
            style={{
              width: `${dispW}px`,
              height: `${dispH}px`,
              transform: `translate(${panX}px, ${panY}px)`,
            }}
            onPointerDown={startPan}
          >
            <canvas
              ref={canvasRef}
              className="sstage__canvas"
              role="img"
              aria-label={
                comparing
                  ? `Original, unedited: ${meta?.alt || meta?.title || 'selected image'}`
                  : meta?.alt || meta?.title || 'Image being edited'
              }
            />

            {cropping && (
              <CropOverlay
                baseSize={baseSize}
                crop={edit.crop}
                displayW={dispW}
                displayH={dispH}
              />
            )}

            {comparing && (
              <span className="sstage__badge" aria-hidden="true">
                Original
              </span>
            )}
          </div>
        )}

        {loading && (
          <div className="sstage__loading" role="status">
            <Loader2 className="sstage__spin" size={22} aria-hidden="true" />
            Opening image…
          </div>
        )}

        {!hasImage && !loading && (
          <div className="sstage__empty">
            <span className="sstage__empty-icon" aria-hidden="true">
              <ImageIcon size={28} strokeWidth={1.4} />
            </span>
            <p className="sstage__empty-title">Your image will appear here</p>
            <p className="sstage__empty-sub">
              Drop an image here, upload one, or pick a photo from the library.
            </p>

            <div className="sstage__empty-actions">
              {onFocusSearch && (
                <button type="button" className="sstage__cta" onClick={onFocusSearch}>
                  <Search size={16} aria-hidden="true" />
                  Search images
                </button>
              )}
              <button
                type="button"
                className="sstage__ghost"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={15} aria-hidden="true" />
                Upload your own
              </button>
            </div>

            {/* Opened by "Upload your own" above, never reached directly. */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-label="Upload an image to edit"
              onChange={(e) => {
                a.loadFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="sstage__error" role="alert">
          {error}
          <button type="button" onClick={a.dismissError} aria-label="Dismiss error">
            <X size={14} aria-hidden="true" />
          </button>
        </p>
      )}
    </div>
  )
}
