import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useSubscription } from '../hooks/useSubscription'
import { useStudio, useStudioActions } from './StudioProvider'
import { useKeyboard } from './useKeyboard'
import StudioHeader from './components/StudioHeader'
import ToolRail from './components/ToolRail'
import ToolPanel from './components/ToolPanel'
import Stage from './components/Stage'
import PromptDock from './components/PromptDock'
import DownloadDialog from './components/DownloadDialog'
import './CreativeStudio.css'

/**
 * The editor, inline on the page and exactly one viewport tall.
 *
 *   header      identity · history · zoom · compare · expand · download
 *   ├ rail      tools, then characters — the whole left column
 *   ├ panel     detail controls for the selected tool
 *   └ stage     the canvas, with the prompt bar pinned to its foot
 *
 * Nothing here scrolls. The frame is a fixed height and each column manages its
 * own overflow, which is what lets the whole editor sit in a single viewport
 * however tall the window is.
 *
 * Full screen is the *same DOM* with a class on it, not a second component —
 * so expanding preserves the image, crop, adjustments, undo stack and zoom
 * without anything being lifted, serialised or restored.
 */
const CreativeStudio = forwardRef(function CreativeStudio({ onFocusSearch }, ref) {
  const { hasImage } = useStudio()
  const { setComparing } = useStudioActions()
  const subscription = useSubscription()

  const [openTool, setOpenTool] = useState('light')
  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [fullscreen, setFullscreen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [fitScale, setFitScale] = useState(1)

  const sectionRef = useRef(null)
  useImperativeHandle(ref, () => sectionRef.current)

  useLockBodyScroll(fullscreen)

  const selectTool = useCallback(
    (id) => {
      setComparing(false)
      setOpenTool(id)
    },
    [setComparing]
  )

  const toggleCharacter = useCallback(
    (id) =>
      setSelectedCharacters((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    []
  )

  const toggleFullscreen = useCallback(() => setFullscreen((f) => !f), [])

  const handleEscape = useCallback(() => {
    if (downloadOpen) setDownloadOpen(false)
    else if (fullscreen) setFullscreen(false)
  }, [downloadOpen, fullscreen])

  useKeyboard({
    containerRef: sectionRef,
    fullscreen,
    paused: downloadOpen,
    onEscape: handleEscape,
    onDownload: () => setDownloadOpen(true),
    onSelectTool: selectTool,
  })

  // Leaving full screen should not strand the page somewhere else.
  useEffect(() => {
    if (fullscreen) return
    sectionRef.current?.scrollIntoView({ block: 'start' })
  }, [fullscreen])

  return (
    <section
      className={`studio${fullscreen ? ' is-fullscreen' : ''}`}
      aria-labelledby="studio-heading"
      ref={sectionRef}
    >
      <div className="studio__frame">
        <StudioHeader
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
          onDownload={() => setDownloadOpen(true)}
          fitScale={fitScale}
        />

        <div className="studio__body">
          <ToolRail
            openTool={openTool}
            onSelectTool={selectTool}
            attachedCount={selectedCharacters.length}
          />

          <ToolPanel
            openTool={openTool}
            selectedCharacters={selectedCharacters}
            onToggleCharacter={toggleCharacter}
            onClearCharacters={() => setSelectedCharacters([])}
          />

          <Stage
            cropping={openTool === 'crop'}
            onFitScale={setFitScale}
            onFocusSearch={onFocusSearch}
          >
            <PromptDock
              hasImage={hasImage}
              selectedCharacters={selectedCharacters}
              onClearCharacters={() => setSelectedCharacters([])}
            />
          </Stage>
        </div>
      </div>

      <DownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        subscription={subscription}
      />
    </section>
  )
})

export default CreativeStudio
