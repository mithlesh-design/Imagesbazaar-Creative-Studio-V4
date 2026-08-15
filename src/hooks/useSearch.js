import { useCallback, useEffect, useRef, useState } from 'react'
import { collections } from '../data/collections'

/**
 * Client-side search engine.
 *
 * Search returns only genuinely relevant matches; generation pads to a fixed
 * variant count. See MIN_RESULTS.
 */

const LATENCY = 2500
const MAX_RESULTS = 24
/** Generation promises a fixed number of variants and must deliver exactly
 *  that many; see VARIANT_COUNT in Home.jsx, which this must match. */
const MIN_RESULTS = 4

// Typing "fail" anywhere forces the error branch for state testing.
const ERROR_TRIGGER = 'fail'

/**
 * Keyword hints expanded so queries like "family", "business", "festival", "wedding", etc.
 * match several distinct relevant stock photos.
 */
const KEYWORD_HINTS = {
  families: ['family', 'parents', 'home', 'children', 'mother', 'father', 'kids', 'lifestyle', 'people'],
  'family-home': ['family', 'parents', 'home', 'house', 'sofa', 'lifestyle', 'relax', 'people', 'couple'],
  'family-kids': ['family', 'children', 'kids', 'child', 'play', 'laugh', 'village', 'street', 'people'],
  'family-grandparents': ['family', 'grandparents', 'seniors', 'elderly', 'grandfather', 'turban', 'people'],
  'family-couples': ['family', 'couples', 'husband', 'wife', 'love', 'romance', 'lifestyle', 'people'],
  'family-teenagers': ['family', 'teenagers', 'students', 'children', 'youth', 'school', 'people'],
  'family-festivals': ['family', 'festivals', 'celebration', 'holi', 'diwali', 'occasion', 'tradition', 'people'],
  'family-wedding': ['family', 'wedding', 'marriage', 'bride', 'groom', 'celebration', 'tradition', 'people'],
  'family-rural': ['family', 'rural', 'farmer', 'village', 'agriculture', 'field', 'people'],
  'family-dining': ['family', 'food', 'dining', 'thali', 'meal', 'kitchen', 'cooking', 'eat', 'people'],
  'family-vacation': ['family', 'vacation', 'holiday', 'travel', 'tourism', 'taj mahal', 'monument', 'people'],
  'family-shopping': ['family', 'shopping', 'retail', 'boutique', 'market', 'saree', 'fashion', 'people'],
  'family-education': ['family', 'education', 'learning', 'school', 'children', 'classroom', 'students'],
  'family-friends': ['family', 'friends', 'group', 'friendship', 'outdoors', 'people'],
  business: ['business', 'office', 'corporate', 'work', 'meeting', 'computer', 'professional', 'people'],
  banking: ['banking', 'finance', 'money', 'rupee', 'insurance', 'business', 'notes', 'investment'],
  healthcare: ['healthcare', 'doctor', 'hospital', 'medical', 'nurse', 'science', 'business', 'people'],
  'indian-culture': ['culture', 'heritage', 'dance', 'temple', 'tradition', 'bharatanatyam', 'family', 'people'],
  fashion: ['fashion', 'saree', 'style', 'model', 'beauty', 'clothing', 'women', 'people'],
  beauty: ['beauty', 'jewellery', 'bride', 'wedding', 'makeup', 'gold', 'women', 'people'],
  fitness: ['fitness', 'workout', 'gym', 'health', 'exercise', 'man', 'lifestyle'],
  'without-people': ['architecture', 'building', 'empty', 'monument', 'city palace', 'udaipur', 'without-people'],
  concepts: ['concepts', 'ideas', 'abstract', 'creative', 'inspiration', 'sunset', 'sun'],
  nature: ['nature', 'mountains', 'himalayas', 'landscape', 'scenery', 'outdoors', 'snow'],
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

/**
 * Matches a query against the image index.
 *
 * `pad` is the difference between the two flows. Generation promises a fixed
 * number of variants and must produce exactly that many, so it tops up from the
 * rest of the library.
 * Search promises relevance and must not: nearly every item's haystack contains
 * "indian", so a two-term query like "indian family" scores currency and
 * healthcare on the strength of one word. Unpadded, only the best-scoring tier
 * survives — better to return six right answers than twenty-four with eight
 * wrong ones at the bottom.
 */
export function match(query, { pad = true } = {}) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/).filter((t) => t.length > 0)
  if (!terms.length) return []

  // Score by term hits in haystack
  const scored = INDEX.map((item) => {
    let score = 0
    for (const term of terms) {
      if (item.haystack.includes(term)) {
        score += 2
      }
    }
    return { item, score }
  })

  const hits = scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score)

  if (!pad) {
    // Only the tier that matched the most terms. An item scoring 2 on "indian"
    // alone is not an answer to "indian family".
    const best = hits.length ? hits[0].score : 0
    return hits.filter((r) => r.score === best).map((r) => r.item).slice(0, MAX_RESULTS)
  }

  let filtered = hits.map((r) => r.item)

  // Short of the promised count: top up so a generation always delivers it.
  if (filtered.length < MIN_RESULTS) {
    const existingIds = new Set(filtered.map((item) => item.id))
    const fallbacks = INDEX.filter((item) => !existingIds.has(item.id))
    filtered = [...filtered, ...fallbacks].slice(0, MIN_RESULTS)
  } else {
    filtered = filtered.slice(0, MAX_RESULTS)
  }

  return filtered
}

export function useSearch() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState([])
  /** Which action produced `results`. The results section reads this rather
   *  than the page's current toggle, so flipping the toggle after a search
   *  cannot relabel results that are already on screen. */
  const [source, setSource] = useState(null)

  const timer = useRef(null)
  const requestId = useRef(0)

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const run = useCallback((q, { allowError }) => {
    setSource('generate')
    setStatus('loading')
    const id = ++requestId.current
    clearTimer()

    timer.current = setTimeout(() => {
      if (id !== requestId.current) return

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

  /** `override` lets a caller run a prompt in the same tick it sets it — a
   *  follow-up chip would otherwise generate the previous query, because the
   *  `setQuery` beside it has not committed yet. */
  const generate = useCallback((override) => {
    const q = (typeof override === 'string' ? override : query).trim()
    if (!q) {
      requestId.current += 1
      clearTimer()
      setStatus('idle')
      setResults([])
      return
    }
    run(q, { allowError: true })
  }, [query, run])

  /**
   * Looking something up in a library that is already in memory. No latency to
   * simulate and nothing to animate — a spinner here would be theatre for work
   * that has already happened. Any in-flight generate is cancelled so its
   * delayed callback cannot land on top of these results.
   */
  const search = useCallback(
    (override) => {
      // Same string guard as `generate`: wired straight to an onClick, the
      // argument would be a SyntheticEvent rather than a query.
      const q = (typeof override === 'string' ? override : query).trim()
      requestId.current += 1
      clearTimer()
      setSource('search')

      if (!q) {
        setStatus('idle')
        setResults([])
        return
      }

      // Unpadded: a search must not top up with items that merely share the
      // word "indian" with the query.
      const found = match(q, { pad: false })
      setResults(found)
      setStatus(found.length ? 'results' : 'empty')
    },
    [query]
  )

  const retry = useCallback(() => run(query.trim(), { allowError: false }), [query, run])

  useEffect(() => clearTimer, [])

  return { query, setQuery, status, results, source, retry, generate, search }
}
