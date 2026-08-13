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
import CharacterBrowser from './components/CharacterBrowser'
import CanvasPanel from './components/CanvasPanel'
import PromptPanel from './components/PromptPanel'
import DownloadDialog from './components/DownloadDialog'
import GenerationModal from './components/GenerationModal'
import './CreativeStudio.css'

const CreativeStudio = forwardRef(function CreativeStudio({ onFocusSearch }, ref) {
  const { setComparing } = useStudioActions()
  const subscription = useSubscription()

  const [activeTool, setActiveTool] = useState(null)
  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [browserOpen, setBrowserOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [genModalOpen, setGenModalOpen] = useState(false)
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

  const handleEscape = useCallback(() => {
    if (downloadOpen) setDownloadOpen(false)
    else if (genModalOpen) setGenModalOpen(false)
    else if (browserOpen) setBrowserOpen(false)
    else if (activeTool) setActiveTool(null)
    else if (fullscreen) setFullscreen(false)
  }, [downloadOpen, genModalOpen, browserOpen, activeTool, fullscreen])

  useKeyboard({
    containerRef: sectionRef,
    fullscreen,
    paused: downloadOpen || browserOpen || genModalOpen,
    onEscape: handleEscape,
    onDownload: () => setDownloadOpen(true),
    onSelectTool: selectTool,
  })

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
            onOpenCharacters={() => setBrowserOpen(true)}
            selectedCharactersCount={selectedCharacters.length}
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
            onGenerate={() => setGenModalOpen(true)}
          />
        </div>
      </div>

      {/* Character Selector Popup Modal */}
      <CharacterBrowser
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        selected={selectedCharacters}
        onToggle={toggleCharacter}
        onClear={clearCharacters}
      />

      {/* 10-Image AI Generation Gallery Modal */}
      <GenerationModal
        open={genModalOpen}
        onClose={() => setGenModalOpen(false)}
        prompt={prompt}
        selectedCharacters={selectedCharacters}
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
