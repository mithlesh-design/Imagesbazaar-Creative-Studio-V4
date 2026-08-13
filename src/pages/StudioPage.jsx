import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Header from '../components/Header'
import MobileMenu from '../components/MobileMenu'
import CreativeStudio from '../studio/CreativeStudio'
import Footer from '../components/Footer'
import './StudioPage.css'

export default function StudioPage({ onNavigateHome }) {
  const [menuOpen, setMenuOpen] = useState(false)

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
            <span>Back to Search</span>
          </button>
          <span className="studio-page__badge">Creative Studio & Image Generation</span>
        </div>
      </div>

      <main id="studio-main" className="studio-page__main">
        <h1 className="sr-only">ImagesBazaar Creative Studio — Image Editor</h1>
        <CreativeStudio onFocusSearch={onNavigateHome} />
      </main>

      <Footer />
    </div>
  )
}
