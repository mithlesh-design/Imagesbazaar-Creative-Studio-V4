/** Prompt suggestions. Copy never lives in components — see README "data-driven". */

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
