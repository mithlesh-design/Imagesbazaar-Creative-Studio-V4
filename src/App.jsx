import { useState } from 'react'
import Home from './pages/Home'
import StudioPage from './pages/StudioPage'
import { StudioProvider } from './studio/StudioProvider'

/**
 * App manages top-level page navigation (Home Landing Search vs Studio Page).
 * StudioProvider sits at the top level so that studio state and image loading
 * are preserved when transitioning across pages.
 */
export default function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const goToStudio = () => {
    setCurrentPage('studio')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const goToHome = () => {
    setCurrentPage('home')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <StudioProvider>
      {currentPage === 'studio' ? (
        <StudioPage onNavigateHome={goToHome} />
      ) : (
        <Home onNavigateStudio={goToStudio} />
      )}
    </StudioProvider>
  )
}
