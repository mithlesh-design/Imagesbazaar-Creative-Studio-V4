import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Header from '../components/Header'
import MobileMenu from '../components/MobileMenu'
import CreativeStudio from '../studio/CreativeStudio'
import { useStudio } from '../studio/StudioProvider'
import './StudioPage.css'

export default function StudioPage({ onNavigateHome }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { hasImage, isEdited, edit, meta } = useStudio()

  return (
    <div className="studio-page">
      <a className="skip-link" href="#studio-main">
        Skip to editor
      </a>

      <Header
        onOpenMenu={() => setMenuOpen(true)}
        onNavigateHome={onNavigateHome}
      />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelectCategory={() => {
          setMenuOpen(false)
          onNavigateHome()
        }}
      />

      <div className="studio-page__bar">
        <div className="container studio-page__bar-inner">
          <button
            type="button"
            className="studio-page__back"
            onClick={onNavigateHome}
            aria-label="Return to image search"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Back to search</span>
          </button>

          {hasImage && (
            <p className="studio-page__meta">
              <span className="studio-page__file">{meta?.title || meta?.name}</span>
              <span className="studio-page__dims">
                {Math.round(edit.crop.w)} × {Math.round(edit.crop.h)}
              </span>
              {isEdited && <span className="studio-page__edited">Edited</span>}
            </p>
          )}
        </div>
      </div>

      <main id="studio-main" className="studio-page__main">
        <h1 className="sr-only">ImagesBazaar Creative Studio — Image Editor</h1>
        <CreativeStudio onFocusSearch={onNavigateHome} />
      </main>
    </div>
  )
}
