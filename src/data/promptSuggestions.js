/** Prompt suggestions. Copy never lives in components — see README "data-driven". */

/** Shown under the hero prompt box on the home page. */
export const heroSuggestions = [
  { id: 'diwali', text: 'Family celebrating Diwali at home' },
  { id: 'corporate', text: 'Corporate team meeting in a Mumbai office' },
  { id: 'farmer', text: 'Farmer in a green field at sunrise' },
  { id: 'wedding', text: 'Bride and groom at a traditional wedding' },
]

/**
 * Shown under the search bar. Short subjects rather than sentences: a search is
 * a lookup, and a chip that reads like a prompt teaches the wrong gesture.
 *
 * Single words on purpose. Search matches strictly — it will not pad a thin
 * result set with unrelated images — so a two-word chip narrows to whatever
 * matches both terms, which in a 24-image placeholder library is often one
 * picture. These six are the best-populated subjects in `collections.js`
 * (family 15, children 4, business 3, wedding 2, celebration 2, culture 2) and
 * should be revisited when the placeholder photography is replaced.
 */
export const searchSuggestions = [
  { id: 'family', text: 'Family' },
  { id: 'children', text: 'Children' },
  { id: 'business', text: 'Business' },
  { id: 'wedding', text: 'Wedding' },
  { id: 'celebration', text: 'Celebration' },
  { id: 'culture', text: 'Culture' },
]

/** Scenario tails appended to whatever the user asked for, to suggest a next
 *  generation. Each must read naturally straight after a noun phrase. */
export const promptScenarios = [
  'celebrating Diwali',
  'at a beach resort',
  'in a modern home',
  'celebrating a birthday',
  'at a traditional wedding',
  'in a rural village',
]

/** Words that carry no subject, so they never become the head of a follow-up. */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'at', 'on', 'with', 'and', 'for', 'to', 'my',
  'our', 'some', 'photo', 'photos', 'image', 'images', 'picture', 'pictures',
])

/**
 * Follow-up prompts for the generate flow: the subject the user asked about,
 * recombined with a scenario they did not ask about.
 *
 * A scenario is dropped when its distinctive last word already appears in the
 * query, so asking for "family celebrating Diwali" is not offered straight
 * back — the point is to open a door, not echo.
 */
export function followUpPrompts(query, limit = 4) {
  const asked = query.toLowerCase()
  const subject = asked
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .slice(0, 2)
    .join(' ')

  if (!subject) return []

  const head = subject.charAt(0).toUpperCase() + subject.slice(1)

  return promptScenarios
    .filter((scenario) => !asked.includes(scenario.split(' ').pop()))
    .slice(0, limit)
    .map((scenario) => ({ id: scenario, text: `${head} ${scenario}` }))
}

/**
 * Shown in the studio's prompt panel. These edit an image that already exists,
 * so they are phrased as instructions rather than subjects.
 *
 * Two strings each. `label` is what the chip shows — two or three words, so six
 * of them scan in a glance and cost two short rows instead of six wrapped ones.
 * `text` is the full instruction that lands in the prompt, because that is what
 * a model needs and what the user then edits.
 */
export const studioSuggestions = [
  { id: 'diyas', label: 'Diwali diyas', text: 'Add vibrant Diwali diyas and warm festive lighting' },
  { id: 'office', label: 'Office backdrop', text: 'Transform the background to a modern corporate office' },
  { id: 'marigold', label: 'Marigolds', text: 'Decorate with traditional Indian marigold flowers' },
  { id: 'golden-hour', label: 'Golden hour', text: 'Set cinematic golden-hour Indian sunset lighting' },
  { id: 'heritage', label: 'Oil painting', text: 'Apply a rich Indian heritage oil-painting style' },
  { id: 'holi', label: 'Colour powder', text: 'Add celebratory colour powder and a festival mood' },
]
