import { useCallback, useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import MobileMenu from '../components/MobileMenu'
import HeroPrompt from '../components/HeroPrompt'
import VoiceButton from '../components/VoiceButton'
import SiteSearch from '../components/SiteSearch'
import ImageSearchModal from '../components/ImageSearchModal'
import CollectionCard from '../components/CollectionCard'
import Footer from '../components/Footer'
import SupportButton from '../components/SupportButton'
import { useStudioActions } from '../studio/StudioProvider'
import { useSearch } from '../hooks/useSearch'
import { followUpPrompts } from '../data/promptSuggestions'
import './Home.css'

export default function Home({ onNavigateStudio }) {
  const search = useSearch()
  const studio = useStudioActions()
  const [menuOpen, setMenuOpen] = useState(false)
  const [imageSearchOpen, setImageSearchOpen] = useState(false)

  /* Two inputs are on screen at once now, so they cannot share the hook's
     `query` — typing in one would rewrite the other. Each owns its text, and
     the hook's query is set at submit purely so the results heading can quote
     whichever one ran. */
  const [prompt, setPrompt] = useState('')
  const [siteQuery, setSiteQuery] = useState('')

  const inputRef = useRef(null)
  const searchRef = useRef(null)
  const resultsRef = useRef(null)

  /** The studio's prompt box: generate ten variations. */
  const submit = useCallback(() => {
    search.setQuery(prompt)
    search.generate(prompt)
  }, [prompt, search])

  /** The site search bar above the studio: a library lookup. */
  const runSearch = useCallback(() => {
    search.setQuery(siteQuery)
    search.search(siteQuery)
  }, [siteQuery, search])

  /** A follow-up chip under the generated grid: swap the prompt and re-run. */
  const regenerate = useCallback(
    (text) => {
      setPrompt(text)
      search.setQuery(text)
      search.generate(text)
    },
    [search]
  )

  /** A category from the mobile menu searches the library. */
  const useSuggestion = useCallback(
    (text) => {
      setMenuOpen(false)
      setSiteQuery(text)
      search.setQuery(text)
      search.search(text)
    },
    [search]
  )

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

  const hasSearchActive = Boolean(search.query.trim()) && search.status !== 'idle'

  // Results live below the fold by design, so reveal them rather than leaving
  // the user looking at an unchanged hero.
  useEffect(() => {
    if (search.status === 'results' || search.status === 'loading') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [search.status])

  // Which action produced these results — a lookup or a generation. The two
  // present differently, and only generation has anything to animate.
  const isSearch = search.source === 'search'
  const shownResults = isSearch ? search.results : search.results.slice(0, 10)
  const followUps = isSearch ? [] : followUpPrompts(search.query)

  return (
    <div className="home-page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header onOpenMenu={() => setMenuOpen(true)} />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelectCategory={useSuggestion}
      />

      <main id="main" className="home-page__main">
        {/* Site-wide image search, above the studio and independent of it. */}
        <SiteSearch
          ref={searchRef}
          value={siteQuery}
          onChange={setSiteQuery}
          onSubmit={runSearch}
          onSearchByImage={() => setImageSearchOpen(true)}
        />

        <section className="hero">
          <h1 className="hero__title">Smart Creative Studio</h1>
          <p className="hero__sub">
            Describe the photograph you need — we’ll generate ten authentic Indian
            variations, ready to edit and licence.
          </p>

          <HeroPrompt
            ref={inputRef}
            value={prompt}
            onChange={setPrompt}
            onSubmit={submit}
            busy={search.status === 'loading'}
            voiceSlot={<VoiceButton onTranscript={setPrompt} />}
          />
        </section>

        <div ref={resultsRef}>
          {hasSearchActive && (
            <section
              className="search-results container"
              aria-label={isSearch ? 'Search results' : 'Generated images'}
            >
              {/* Generation is the only flow with something to wait for. Search
                  reads an in-memory library, so it has no loading state at all
                  — not a faster one. */}
              {search.status === 'loading' && !isSearch && (
                <GenerationLoadingState query={search.query} />
              )}

              {search.status === 'empty' && (
                <div className="search-results__empty">
                  <h2>{isSearch ? 'No images matched' : 'No matching images generated'}</h2>
                  <p>
                    {isSearch ? (
                      <>
                        Try a broader subject like <em>family</em>, <em>wedding</em> or{' '}
                        <em>rural India</em>.
                      </>
                    ) : (
                      <>
                        Try describing your requirement like <em>family celebrating Diwali</em> or{' '}
                        <em>corporate office meeting in Mumbai</em>.
                      </>
                    )}
                  </p>
                </div>
              )}

              {search.status === 'error' && (
                <div className="search-results__empty" role="alert">
                  <h2>Generation didn’t complete</h2>
                  <p>Something went wrong on our side. Your prompt is still here — try again.</p>
                  <button
                    type="button"
                    className="search-results__retry"
                    onClick={search.retry}
                  >
                    Try again
                  </button>
                </div>
              )}

              {search.status === 'results' && shownResults.length > 0 && (
                <div className="search-results__content">
                  <div className="search-results__head-wrap">
                    <h2 className="search-results__heading">
                      {isSearch ? 'Search results' : `10 variations for “${search.query}”`}
                    </h2>
                    <p className="search-results__sub">
                      {isSearch
                        ? `${shownResults.length} ${shownResults.length === 1 ? 'image' : 'images'
                        } for “${search.query}” — pick one to open it in the Creative Studio.`
                        : 'Pick one to open it in the Creative Studio.'}
                    </p>
                  </div>

                  <ul className="search-results__grid-5x2">
                    {shownResults.map((item, i) => (
                      <CollectionCard
                        key={item.id}
                        collection={item.collection}
                        onSelect={selectImage}
                        priority={i < 5}
                      />
                    ))}
                  </ul>

                  {/* Generate only: where next, having seen these ten. Search
                      users already have a query box and chips above. */}
                  {!isSearch && followUps.length > 0 && (
                    <div className="followups">
                      <h3 className="followups__title">Suggested prompts</h3>
                      <ul className="followups__list">
                        {followUps.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              className="followups__chip"
                              onClick={() => regenerate(s.text)}
                            >
                              {s.text}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
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

  useEffect(() => {
    const interval = setInterval(() => setTextIndex((prev) => (prev + 1) % 4), 600)
    return () => clearInterval(interval)
  }, [])

  const loadingTexts = [
    `Analysing your brief: “${query}”…`,
    'Applying lighting models…',
    'Rendering high-resolution detail…',
    'Finalising ten variations…',
  ]

  return (
    <div className="generation-loading">
      <div className="generation-loading__header">
        <h2 className="generation-loading__title">
          <span className="generation-loading__spinner" aria-hidden="true" />
          Generating images
        </h2>
        <p className="generation-loading__status" role="status" aria-live="polite">
          {loadingTexts[textIndex]}
        </p>
      </div>
      <ul className="search-results__grid-5x2">
        {Array.from({ length: 10 }).map((_, i) => (
          <li key={i} className="skeleton-card">
            <div className="skeleton-card__image" />
            <div className="skeleton-card__text" />
          </li>
        ))}
      </ul>
    </div>
  )
}
