import { useCallback, useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import MobileMenu from '../components/MobileMenu'
import SearchBar from '../components/SearchBar'
import ImageSearchModal from '../components/ImageSearchModal'
import HeroBanner from '../components/HeroBanner'
import CollectionGrid from '../components/CollectionGrid'
import AboutSection from '../components/AboutSection'
import PopularSearches from '../components/PopularSearches'
import Footer from '../components/Footer'
import SupportButton from '../components/SupportButton'
import CreativeStudio from '../studio/CreativeStudio'
import { useStudioActions } from '../studio/StudioProvider'
import { useSearch } from '../hooks/useSearch'
import './Home.css'

export default function Home() {
  const search = useSearch()
  const studio = useStudioActions()
  const [menuOpen, setMenuOpen] = useState(false)
  const [imageSearchOpen, setImageSearchOpen] = useState(false)
  const [studioInView, setStudioInView] = useState(false)

  const inputRef = useRef(null)
  const studioRef = useRef(null)

  /**
   * The studio's prompt dock is sticky to the bottom of the viewport, and the
   * support button is fixed there too — on a phone they would sit on top of one
   * another. The support button stands down while the studio is on screen.
   */
  useEffect(() => {
    const node = studioRef.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => setStudioInView(entry.isIntersecting),
      { rootMargin: '-25% 0px -25% 0px' }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  /** Chips, menu items: fill the search field so image results surface. */
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
   * The single entry point for "select an image" — used by both search results
   * and collection cards. Loads the high-resolution variant and brings the
   * studio into view.
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
      requestAnimationFrame(() => {
        studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    [studio]
  )

  const focusSearch = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header onOpenMenu={() => setMenuOpen(true)} />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelectCategory={runSearch}
      />

      <main id="main">
        <h1 className="sr-only">
          ImagesBazaar — search the largest collection of authentic Indian images
        </h1>

        <div className="home__search container">
          <SearchBar
            ref={inputRef}
            search={search}
            onSelectImage={selectImage}
            onOpenImageSearch={() => setImageSearchOpen(true)}
          />
        </div>

        <CreativeStudio ref={studioRef} onFocusSearch={focusSearch} />

        <HeroBanner />
        <CollectionGrid onSelect={selectImage} />
        <AboutSection />
        <PopularSearches onSelect={runSearch} />
      </main>

      <Footer />
      <SupportButton hidden={studioInView} />

      <ImageSearchModal
        open={imageSearchOpen}
        onClose={() => setImageSearchOpen(false)}
      />
    </>
  )
}
