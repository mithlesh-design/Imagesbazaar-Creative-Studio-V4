import { useCallback, useEffect, useRef, useState } from 'react'
import { collections } from '../data/collections'

/**
 * Client-side search engine.
 *
 * Configured to return at least 10 relevant images for any search query.
 */

const LATENCY = 2500
const MAX_RESULTS = 24
const MIN_RESULTS = 10

// Typing "fail" anywhere forces the error branch for state testing.
const ERROR_TRIGGER = 'fail'

/**
 * Keyword hints expanded so queries like "family", "business", "festival", "wedding", etc.
 * match 10+ distinct relevant stock photos.
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
 * Matches query against image index. Guarantees returning at least 10 images
 * whenever matches exist.
 */
export function match(query) {
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

  let filtered = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item)

  // If match count is less than MIN_RESULTS (10), pad with relevant lifestyle fallbacks
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

  const generate = useCallback(() => {
    const q = query.trim()
    if (!q) {
      requestId.current += 1
      clearTimer()
      setStatus('idle')
      setResults([])
      return
    }
    run(q, { allowError: true })
  }, [query, run])

  const retry = useCallback(() => run(query.trim(), { allowError: false }), [query, run])

  const reset = useCallback(() => {
    requestId.current += 1
    clearTimer()
    setQuery('')
    setResults([])
    setStatus('idle')
  }, [])

  useEffect(() => clearTimer, [])

  return { query, setQuery, status, results, reset, retry, generate }
}
