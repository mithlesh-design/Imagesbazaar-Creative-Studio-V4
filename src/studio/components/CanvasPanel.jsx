import {
  Download,
  Maximize,
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
import RatioPills from './controls/RatioPills'
import EditToolbar from './EditToolbar'
import Stage from './Stage'
import './CanvasPanel.css'

export default function CanvasPanel({
  activeTool,
  onSelectTool,
  fullscreen,
  onToggleFullscreen,
  onDownload,
  fitScale,
  onFitScale,
  onFocusSearch,
}) {
  const { hasImage, canUndo, canRedo, isEdited, comparing, view } = useStudio()
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
    <section className="cvpanel" aria-labelledby="cvpanel-heading">
      <h2 className="sr-only" id="cvpanel-heading">
        Creative Studio canvas
      </h2>

      <div className="cvpanel__bar">
        <RatioPills />

        <div className="cvpanel__actions">
          <div className="cvpanel__group" role="group" aria-label="View">
            <button
              type="button"
              className="cvpanel__icon"
              onClick={() => a.zoomStep(-1)}
              disabled={!hasImage}
              aria-label="Zoom out"
              title="Zoom out (−)"
            >
              <Minus size={15} aria-hidden="true" />
            </button>
            <span className="cvpanel__level" aria-live="off">
              {hasImage ? `${shownZoom}%` : '—'}
            </span>
            <button
              type="button"
              className="cvpanel__icon"
              onClick={() => a.zoomStep(1)}
              disabled={!hasImage}
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              <Plus size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`cvpanel__icon${view.fit ? ' is-active' : ''}`}
              onClick={a.zoomFit}
              disabled={!hasImage}
              aria-pressed={view.fit}
              aria-label="Fit to canvas"
              title="Fit to canvas (0)"
            >
              <Maximize size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`cvpanel__icon${comparing ? ' is-active' : ''}`}
              disabled={!hasImage || !isEdited}
              aria-pressed={comparing}
              aria-label="Hold to see the original"
              title="Hold to see the original (\)"
              {...holdCompare}
            >
              <SplitSquareHorizontal size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cvpanel__icon"
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
          </div>

          <div className="cvpanel__group" role="group" aria-label="History">
            <button
              type="button"
              className="cvpanel__icon"
              onClick={a.undo}
              disabled={!canUndo}
              aria-label="Undo"
              title="Undo (⌘Z)"
            >
              <Undo2 size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cvpanel__icon"
              onClick={a.redo}
              disabled={!canRedo}
              aria-label="Redo"
              title="Redo (⇧⌘Z)"
            >
              <Redo2 size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cvpanel__icon"
              onClick={a.reset}
              disabled={!isEdited}
              aria-label="Reset all edits"
              title="Reset all edits"
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className="cvpanel__download"
            onClick={onDownload}
            disabled={!hasImage}
          >
            <Download size={16} aria-hidden="true" />
            <span className="cvpanel__download-label">Download</span>
          </button>
        </div>
      </div>

      <Stage
        cropping={activeTool === 'crop'}
        onFitScale={onFitScale}
        onFocusSearch={onFocusSearch}
      />

      <EditToolbar activeTool={activeTool} onSelectTool={onSelectTool} />
    </section>
  )
}
