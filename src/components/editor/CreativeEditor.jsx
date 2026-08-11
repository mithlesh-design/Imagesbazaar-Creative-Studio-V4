import { forwardRef, useState } from 'react'
import EditorToolbar from './EditorToolbar'
import EditorStage from './EditorStage'
import PromptDock from './PromptDock'
import DownloadDialog from './DownloadDialog'
import { useSubscription } from '../../hooks/useSubscription'
import './CreativeEditor.css'

const CreativeEditor = forwardRef(function CreativeEditor({ editor, onFocusSearch }, ref) {
  const [openTool, setOpenTool] = useState(null)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const subscription = useSubscription()

  return (
    <section className="ce" aria-labelledby="ce-heading" ref={ref}>
      <div className="ce__inner">
        <div className="ce__head">
          <h2 className="ce__title" id="ce-heading">
            Creative Editor
          </h2>
          <p className="ce__sub">
            Select an image, adjust it, then download in the size you need.
          </p>
        </div>

        <EditorToolbar
          editor={editor}
          openTool={openTool}
          setOpenTool={setOpenTool}
          onDownload={() => setDownloadOpen(true)}
        />

        <div className="ce__work">
          <EditorStage editor={editor} onFocusSearch={onFocusSearch} />
          <PromptDock hasImage={editor.hasImage} />
        </div>
      </div>

      <DownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        editor={editor}
        subscription={subscription}
      />
    </section>
  )
})

export default CreativeEditor
