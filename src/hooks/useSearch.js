import { useCallback, useEffect, useRef, useState } from 'react'
import { collections } from '../data/collections'
import { popularSearches } from '../data/popularSearches'

/**
 * Client-side search over the image library.
 *
 * Results are the images themselves — picking one opens it in the Creative
 * Editor. There is no backend, so matching runs locally behind a short
 * simulated latency, which keeps every UI state (idle / loading / results /
 * empty / error) genuinely reachable.
 */

const LATENCY = 280
const MAX_RESULTS = 8

// Typing "fail" anywhere forces the error branch so that state stays testable.
const ERROR_TRIGGER = 'fail'

/**
 * Keyword chips are folded into the haystack of the collection they belong to,
 * so searching "farmer" finds Rural India even though no title contains it.
 */
const KEYWORD_HINTS = {
  'rural-india': ['farmer', 'village', 'agriculture', 'field'],
  families: ['family', 'parents', 'home'],
  business: ['office', 'corporate', 'work', 'computer', 'meeting'],
  banking: ['insurance', 'money', 'finance', 'rupee', 'savings'],
  wedding: ['marriage', 'bride', 'groom', 'couples'],
  healthcare: ['doctor', 'hospital', 'medical', 'nurse'],
  education: ['students', 'school', 'classroom', 'learning'],
  food: ['kitchen', 'cooking', 'thali', 'meal'],
  festivals: ['celebration', 'holi', 'diwali', 'festival'],
  vacations: ['travel', 'holiday', 'tourism', 'taj mahal'],
  shopping: ['retail', 'market', 'store', 'mobile'],
  beauty: ['jewellery', 'makeup', 'bridal'],
  fashion: ['saree', 'clothing', 'style', 'model'],
  fitness: ['gym', 'workout', 'health', 'yoga'],
  couples: ['romance', 'love', 'partner'],
  children: ['kids', 'child', 'play'],
  seniors: ['elderly', 'grandparent', 'old age'],
  teenagers: ['youth', 'teen', 'college'],
  friends: ['group', 'friendship'],
  nature: ['landscape', 'mountains', 'outdoors', 'scenery'],
  'indian-culture': ['dance', 'tradition', 'heritage', 'temple'],
  'without-people': ['architecture', 'building', 'empty', 'monument'],
  concepts: ['idea', 'abstract', 'creative', 'inspiration'],
  adults: ['lifestyle', 'home', 'relax'],
}

const INDEX = collections.map((c) => ({
  type: 'image',
  id: c.id,
  label: c.title,
  query: c.searchQuery,
  image: c.image,
  image2x: c.image2x,
  imageFull: c.imageFull,
  alt: c.alt,
  collection: c,
  haystack: [c.title, c.searchQuery, c.alt, ...(KEYWORD_HINTS[c.id] ?? [])]
    .join(' ')
    .toLowerCase(),
}))

/** Every popular-search chip must resolve to at least one image. */
export function match(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/).filter((t) => t.length > 1)
  if (!terms.length) return []

  // Score by how many terms hit, so the most relevant images float up.
  return INDEX.map((item) => ({
    item,
    score: terms.reduce((n, t) => n + (item.haystack.includes(t) ? 1 : 0), 0),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((r) => r.item)
}

export function useSearch() {
  const [query, setQuery] = useState('')
  // 'idle' | 'loading' | 'results' | 'empty' | 'error'
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState([])

  const timer = useRef(null)
  const requestId = useRef(0)

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const run = useCallback((q, { allowError }) => {
    setStatus('loading')
    const id = ++requestId.current
    clearTimer()

    timer.current = setTimeout(() => {
      if (id !== requestId.current) return // a newer keystroke won

      if (allowError && q.toLowerCase().includes(ERROR_TRIGGER)) {
        setResults([])
        setStatus('error')
        return
      }

      const found = match(q)
      setResults(found)
      setStatus(found.length ? 'results' : 'empty')
    }, LATENCY)
  }, [])

  // Debounced search-as-you-type.
  useEffect(() => {
    const q = query.trim()

    if (!q) {
      requestId.current += 1 // cancel anything in flight
      clearTimer()
      setStatus('idle')
      setResults([])
      return
    }

    run(q, { allowError: true })
    return clearTimer
  }, [query, run])

  // "Try again" re-runs without the error trigger so it can actually resolve.
  const retry = useCallback(() => run(query.trim(), { allowError: false }), [query, run])

  const reset = useCallback(() => {
    requestId.current += 1
    clearTimer()
    setQuery('')
    setResults([])
    setStatus('idle')
  }, [])

  useEffect(() => clearTimer, [])

  return { query, setQuery, status, results, reset, retry }
}
