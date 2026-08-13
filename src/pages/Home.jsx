import { useCallback, useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import MobileMenu from '../components/MobileMenu'
import HeroPrompt from '../components/HeroPrompt'
import VoiceButton from '../components/VoiceButton'
import CollectionCard from '../components/CollectionCard'
import Footer from '../components/Footer'
import SupportButton from '../components/SupportButton'
import { useStudioActions } from '../studio/StudioProvider'
import { useSearch } from '../hooks/useSearch'
import { heroSuggestions } from '../data/promptSuggestions'
import './Home.css'

export default function Home({ onNavigateStudio }) {
  const search = useSearch()
  const studio = useStudioActions()
  const [menuOpen, setMenuOpen] = useState(false)

  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  const submit = useCallback(() => {
    search.generate()
  }, [search])

  const useSuggestion = useCallback(
    (text) => {
      setMenuOpen(false)
      search.setQuery(text)
      inputRef.current?.focus()
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
        onSelectCategory={useSuggestion}
      />

      <main id="main" className="home-page__main">
        <section className="hero">
          <h1 className="hero__title">Every image India can imagine</h1>
          <p className="hero__sub">
            Describe the photograph you need — we’ll generate ten authentic Indian
            variations, ready to edit and licence.
          </p>

          <HeroPrompt
            ref={inputRef}
            value={search.query}
            onChange={search.setQuery}
            onSubmit={submit}
            busy={search.status === 'loading'}
            voiceSlot={<VoiceButton onTranscript={search.setQuery} />}
          />

          <ul className="hero__suggestions">
            {heroSuggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="hero__suggestion"
                  onClick={() => useSuggestion(s.text)}
                >
                  <span className="hero__suggestion-glyph" aria-hidden="true">
                    ✦
                  </span>
                  <span className="hero__suggestion-text">{s.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div ref={resultsRef}>
          {hasSearchActive && (
            <section className="search-results container" aria-label="Generated images">
              {search.status === 'loading' && <GenerationLoadingState query={search.query} />}

              {search.status === 'empty' && (
                <div className="search-results__empty">
                  <h2>No matching images generated</h2>
                  <p>
                    Try describing your requirement like <em>family celebrating Diwali</em> or{' '}
                    <em>corporate office meeting in Mumbai</em>.
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

              {search.status === 'results' && generatedResults.length > 0 && (
                <div className="search-results__content">
                  <div className="search-results__head-wrap">
                    <h2 className="search-results__heading">
                      10 variations for “{search.query}”
                    </h2>
                    <p className="search-results__sub">
                      Pick one to open it in the Creative Studio.
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
        </div>
      </main>

      <Footer />
      <SupportButton />
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
