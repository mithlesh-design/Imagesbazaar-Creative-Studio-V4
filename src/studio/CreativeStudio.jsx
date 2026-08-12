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
import { useStudioActions } from './StudioProvider'
import { useKeyboard } from './useKeyboard'
import CharactersPanel from './components/CharactersPanel'
import CharacterBrowser from './components/CharacterBrowser'
import CanvasPanel from './components/CanvasPanel'
import PromptPanel from './components/PromptPanel'
import DownloadDialog from './components/DownloadDialog'
import './CreativeStudio.css'

/**
 * The editor, inline on the page and exactly one viewport tall.
 *
 *   ├ characters   who appears in the image
 *   ├ canvas       ratios and session actions, the picture, the tool strip
 *   └ prompt       what to make, what to make it from, and the two actions
 *
 * Nothing here scrolls. The frame is a fixed height and each card manages its
 * own overflow, which is what lets the whole editor sit in a single viewport
 * however tall the window is.
 *
 * Full screen is the *same DOM* with a class on it, not a second component —
 * so expanding preserves the image, crop, adjustments, undo stack and zoom
 * without anything being lifted, serialised or restored.
 *
 * Prompt and references live here rather than in `PromptPanel` because they
 * outlive it: the panel unmounts on a narrow layout, and losing what someone
 * typed because the window got smaller is not a defensible way to behave.
 */
const CreativeStudio = forwardRef(function CreativeStudio({ onFocusSearch }, ref) {
  const { setComparing } = useStudioActions()
  const subscription = useSubscription()

  const [activeTool, setActiveTool] = useState(null)
  const [gender, setGender] = useState('male')
  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [browserOpen, setBrowserOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [fitScale, setFitScale] = useState(1)

  const [prompt, setPrompt] = useState('')
  const [refs, setRefs] = useState([])

  const sectionRef = useRef(null)
  useImperativeHandle(ref, () => sectionRef.current)

  useLockBodyScroll(fullscreen)

  const selectTool = useCallback(
    (id) => {
      setComparing(false)
      setActiveTool(id)
    },
    [setComparing]
  )

  const toggleCharacter = useCallback(
    (id) =>
      setSelectedCharacters((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    []
  )

  const clearCharacters = useCallback(() => setSelectedCharacters([]), [])

  const addRef = useCallback(
    (item) => setRefs((r) => [...r, { ...item, key: `${item.type}-${r.length}-${item.name}` }]),
    []
  )

  const removeRef = useCallback(
    (key) => setRefs((r) => r.filter((x) => x.key !== key)),
    []
  )

  const toggleFullscreen = useCallback(() => setFullscreen((f) => !f), [])

  /** Innermost thing first: dialog, browser, popover, then full screen. */
  const handleEscape = useCallback(() => {
    if (downloadOpen) setDownloadOpen(false)
    else if (browserOpen) setBrowserOpen(false)
    else if (activeTool) setActiveTool(null)
    else if (fullscreen) setFullscreen(false)
  }, [downloadOpen, browserOpen, activeTool, fullscreen])

  useKeyboard({
    containerRef: sectionRef,
    fullscreen,
    paused: downloadOpen || browserOpen,
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
      aria-label="Creative Studio"
      ref={sectionRef}
    >
      <div className="studio__grid">
        <div className="studio__card studio__card--left">
          <CharactersPanel
            gender={gender}
            onGenderChange={setGender}
            selected={selectedCharacters}
            onToggle={toggleCharacter}
            onOpenBrowser={() => setBrowserOpen(true)}
          />
        </div>

        <div className="studio__card studio__card--canvas">
          <CanvasPanel
            activeTool={activeTool}
            onSelectTool={selectTool}
            fullscreen={fullscreen}
            onToggleFullscreen={toggleFullscreen}
            onDownload={() => setDownloadOpen(true)}
            fitScale={fitScale}
            onFitScale={setFitScale}
            onFocusSearch={onFocusSearch}
          />
        </div>

        <div className="studio__card studio__card--right">
          <PromptPanel
            prompt={prompt}
            onPromptChange={setPrompt}
            refs={refs}
            onAddRef={addRef}
            onRemoveRef={removeRef}
            selectedCharacters={selectedCharacters}
            onClearCharacters={clearCharacters}
          />
        </div>
      </div>

      <CharacterBrowser
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        selected={selectedCharacters}
        onToggle={toggleCharacter}
        onClear={clearCharacters}
      />

      <DownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        subscription={subscription}
      />
    </section>
  )
})

export default CreativeStudio
