import { useCallback, useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import MobileMenu from '../components/MobileMenu'
import SearchBar from '../components/SearchBar'
import CollectionCard from '../components/CollectionCard'
import ImageSearchModal from '../components/ImageSearchModal'
import Footer from '../components/Footer'
import SupportButton from '../components/SupportButton'
import { useStudioActions } from '../studio/StudioProvider'
import { useSearch } from '../hooks/useSearch'
import './Home.css'

export default function Home({ onNavigateStudio }) {
  const search = useSearch()
  const studio = useStudioActions()
  const [menuOpen, setMenuOpen] = useState(false)
  const [imageSearchOpen, setImageSearchOpen] = useState(false)

  const inputRef = useRef(null)

  const runSearch = useCallback(
    (query) => {
      setMenuOpen(false)
      search.setQuery(query)

      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        inputRef.current?.focus({ preventScroll: true })
      })
    },
    [search]
  )

  /**
   * Selection flow: Loads the selected image into studio state and immediately
   * navigates to the dedicated Creative Studio page.
   */
  const selectImage = useCallback(
    (collection) => {
      if (!collection) return
      studio.loadFromSource({
        url: collection.imageFull,
        name: `${collection.id}.jpg`,
        title: collection.title,
        alt: collection.alt,
      })
      onNavigateStudio?.()
    },
    [studio, onNavigateStudio]
  )

  const hasSearchActive = Boolean(search.query.trim())
  const generatedResults = search.results.slice(0, 10)

  return (
    <div className="home-page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header onOpenMenu={() => setMenuOpen(true)} />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelectCategory={runSearch}
      />

      <main id="main" className="home-page__main">
        <h1 className="sr-only">
          ImagesBazaar — Explain what kind of image you are looking for
        </h1>

        <div className="home__search container">
          <SearchBar
            ref={inputRef}
            search={search}
            onSelectImage={selectImage}
            onOpenImageSearch={() => setImageSearchOpen(true)}
          />
        </div>

        {/* Dynamic 10-Image Generation 5x2 Grid */}
        {hasSearchActive && (
          <section className="search-results container" aria-label="Generated Images">
            {search.status === 'loading' && (
              <GenerationLoadingState query={search.query} />
            )}

            {search.status === 'empty' && (
              <div className="search-results__empty">
                <h3>No matching images generated</h3>
                <p>
                  Try describing your requirement like <em>family celebrating Diwali</em> or{' '}
                  <em>corporate office meeting in Mumbai</em>.
                </p>
              </div>
            )}

            {search.status === 'results' && generatedResults.length > 0 && (
              <div className="search-results__content">
                <div className="search-results__head-wrap">
                  <h2 className="search-results__heading">
                    10 Generated Variations for “{search.query}”
                  </h2>
                  <p className="search-results__sub">
                    5 × 2 Grid — Click any image to open in Creative Studio for editing & customization
                  </p>
                </div>

                <ul className="search-results__grid-5x2">
                  {generatedResults.map((item, i) => (
                    <CollectionCard
                      key={item.id}
                      collection={item.collection}
                      onSelect={selectImage}
                      priority={i < 5}
                    />
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
      <SupportButton />

      <ImageSearchModal
        open={imageSearchOpen}
        onClose={() => setImageSearchOpen(false)}
      />
    </div>
  )
}

function GenerationLoadingState({ query }) {
  const [textIndex, setTextIndex] = useState(0)
  const loadingTexts = [
    `Analyzing requirement: "${query}"...`,
    'Applying AI lighting models...',
    'Rendering high-resolution details...',
    'Finalizing 10 variations...',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length)
    }, 600)
    return () => clearInterval(interval)
  }, [loadingTexts.length])

  return (
    <div className="generation-loading">
      <div className="generation-loading__header">
        <h2 className="generation-loading__title">
          <span className="generation-loading__spinner"></span>
          Generating Images
        </h2>
        <p className="generation-loading__status">
          {loadingTexts[textIndex]}
        </p>
      </div>
      <ul className="search-results__grid-5x2">
        {Array.from({ length: 10 }).map((_, i) => (
          <li key={i} className="skeleton-card">
            <div className="skeleton-card__image"></div>
            <div className="skeleton-card__text"></div>
          </li>
        ))}
      </ul>
    </div>
  )
}
