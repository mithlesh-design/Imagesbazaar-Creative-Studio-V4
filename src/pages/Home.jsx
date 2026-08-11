import { useCallback, useRef, useState } from 'react'
import Header from '../components/Header'
import MobileMenu from '../components/MobileMenu'
import SearchBar from '../components/SearchBar'
import ImageSearchModal from '../components/ImageSearchModal'
import CreativeEditor from '../components/editor/CreativeEditor'
import HeroBanner from '../components/HeroBanner'
import CollectionGrid from '../components/CollectionGrid'
import AboutSection from '../components/AboutSection'
import PopularSearches from '../components/PopularSearches'
import Footer from '../components/Footer'
import SupportButton from '../components/SupportButton'
import { useSearch } from '../hooks/useSearch'
import { useImageEditor } from '../hooks/useImageEditor'
import './Home.css'

export default function Home() {
  const search = useSearch()
  const editor = useImageEditor()
  const [menuOpen, setMenuOpen] = useState(false)
  const [imageSearchOpen, setImageSearchOpen] = useState(false)

  const inputRef = useRef(null)
  const editorRef = useRef(null)

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
   * and collection cards. Loads the high-resolution variant into the editor
   * and brings it into view.
   */
  const selectImage = useCallback(
    (collection) => {
      if (!collection) return
      editor.loadFromSource({
        url: collection.imageFull,
        name: `${collection.id}.jpg`,
        title: collection.title,
        alt: collection.alt,
      })
      requestAnimationFrame(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    [editor]
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

        <CreativeEditor ref={editorRef} editor={editor} onFocusSearch={focusSearch} />

        <HeroBanner />
        <CollectionGrid onSelect={selectImage} />
        <AboutSection />
        <PopularSearches onSelect={runSearch} />
      </main>

      <Footer />
      <SupportButton />

      <ImageSearchModal
        open={imageSearchOpen}
        onClose={() => setImageSearchOpen(false)}
      />
    </>
  )
}
