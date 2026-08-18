/** Copy for the brief-completeness notice. Never lives in the component — see
 *  README "data-driven". */
export const briefNotice = {
  title: 'Brand & product required',
  body: 'Specify your brand and the product or service you want a campaign for.',
  tip: 'Optional: add your website link so we can learn your brand’s colours, visual style and overall brand DNA.',
}

/**
 * Whether a brief carries enough to generate from.
 *
 * A deliberately shallow proxy, and worth being honest about: with no backend
 * there is no way to verify that a *brand* and a *product* were actually named.
 * What this checks is that the brief is a phrase rather than a single word —
 * two words and eight characters, which "Tanishq necklace" clears and "shoes"
 * does not. It exists to stop a one-word brief reaching a generator that cannot
 * do anything useful with it, not to validate meaning.
 */
export function isBriefComplete(text) {
  const trimmed = (text ?? '').trim()
  return trimmed.length >= 8 && trimmed.split(/\s+/).filter(Boolean).length >= 2
}
