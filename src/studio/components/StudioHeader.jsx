import { memo } from 'react'
import {
  Download,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Redo2,
  RotateCcw,
  SplitSquareHorizontal,
  Undo2,
} from 'lucide-react'
import { useStudio, useStudioActions } from '../StudioProvider'
import './StudioHeader.css'

/**
 * One 52px strip across the top of the editor: what you are working on, on the
 * left; everything you do to the session, on the right.
 *
 * Compare is press-and-hold rather than a toggle — you want the original in
 * view only while you are looking at it.
 */
function StudioHeader({ fullscreen, onToggleFullscreen, onDownload, fitScale }) {
  const { meta, hasImage, canUndo, canRedo, isEdited, comparing, view, edit } = useStudio()
  const a = useStudioActions()

  const shownZoom = Math.round((view.fit ? fitScale : view.zoom) * 100)

  const holdCompare = {
    onPointerDown: (e) => {
      e.currentTarget.setPointerCapture?.(e.pointerId)
      a.setComparing(true)
    },
    onPointerUp: () => a.setComparing(false),
    onPointerCancel: () => a.setComparing(false),
    onPointerLeave: () => a.setComparing(false),
  }

  return (
    <header className="shead">
      <div className="shead__id">
        <h2 className="shead__title" id="studio-heading">
          Creative Studio
        </h2>
        {hasImage && (
          <>
            <span className="shead__sep" aria-hidden="true" />
            <span className="shead__file" title={meta?.title || meta?.name}>
              {meta?.title || meta?.name}
            </span>
            <span className="shead__dims">
              {Math.round(edit.crop.w)} × {Math.round(edit.crop.h)}
            </span>
            {isEdited && <span className="shead__edited">Edited</span>}
          </>
        )}
      </div>

      <div className="shead__actions">
        <div className="shead__group" role="group" aria-label="History">
          <button
            type="button"
            className="shead__icon"
            onClick={a.undo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (⌘Z)"
          >
            <Undo2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="shead__icon"
            onClick={a.redo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (⇧⌘Z)"
          >
            <Redo2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="shead__icon"
            onClick={a.reset}
            disabled={!isEdited}
            aria-label="Reset all edits"
            title="Reset all edits"
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="shead__group" role="group" aria-label="Zoom">
          <button
            type="button"
            className="shead__icon"
            onClick={() => a.zoomStep(-1)}
            disabled={!hasImage}
            aria-label="Zoom out"
            title="Zoom out (−)"
          >
            <Minus size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="shead__level"
            onClick={a.zoomFit}
            disabled={!hasImage}
            title="Fit to screen (0)"
          >
            {hasImage ? `${shownZoom}%` : '—'}
          </button>
          <button
            type="button"
            className="shead__icon"
            onClick={() => a.zoomStep(1)}
            disabled={!hasImage}
            aria-label="Zoom in"
            title="Zoom in (+)"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className={`shead__btn${comparing ? ' is-active' : ''}`}
          disabled={!hasImage || !isEdited}
          aria-pressed={comparing}
          title="Hold to see the original (\)"
          {...holdCompare}
        >
          <SplitSquareHorizontal size={15} aria-hidden="true" />
          <span>Compare</span>
        </button>

        <button
          type="button"
          className="shead__btn shead__btn--square"
          onClick={onToggleFullscreen}
          aria-pressed={fullscreen}
          aria-label={fullscreen ? 'Exit full screen' : 'Expand to full screen'}
          title={fullscreen ? 'Exit full screen (Esc)' : 'Expand to full screen'}
        >
          {fullscreen ? (
            <Minimize2 size={15} aria-hidden="true" />
          ) : (
            <Maximize2 size={15} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className="shead__download"
          onClick={onDownload}
          disabled={!hasImage}
        >
          <Download size={16} aria-hidden="true" />
          <span>Download</span>
        </button>
      </div>
    </header>
  )
}

export default memo(StudioHeader)
