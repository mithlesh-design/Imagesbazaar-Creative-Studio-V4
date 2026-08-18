/** Copy and signal detection for the brief checklist. Copy never lives in the
 *  component — see README "data-driven". */

export const briefNotice = {
  blockedTitle: 'Brand & product required',
  hintTitle: 'A couple of details will sharpen this',
  brandLabel: 'Brand',
  brandMissing: 'name the brand this campaign is for',
  productLabel: 'Product or service',
  productMissing: 'say what you are promoting',
  websiteLabel: 'Website',
  websiteMissing: 'optional — lets us read your brand’s colours and visual style',
  websiteFound: 'we’ll read your brand DNA from it',
}

/* A domain or URL. Requires a dot and a 2+ letter ending so ordinary prose
   ("e.g.", "3.5") does not read as a link. */
const URL_RE = /\b(?:https?:\/\/)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/\S*)?/i

/* Capitalised words that are not brands. Deliberately short: this list can only
   ever be incomplete, which is exactly why the brand signal is advisory and can
   never disable the button. */
const NOT_BRANDS = new Set([
  'a','an','the','and','or','for','with','of','in','on','at','to','from','by','my','our','we','i',
  'create','make','build','need','want','looking','please','campaign','ad','advert','advertising',
  'photo','photos','image','images','picture','shoot','video','post','poster','banner','brand',
  'product','service','new','best','premium','luxury','modern','traditional','indian','india',
  'gold','silver','red','blue','green','black','white',
  'diwali','holi','eid','christmas','navratri','pongal','onam','raksha','rakhi','durga','ganesh',
  'january','february','march','april','may','june','july','august','september','october',
  'november','december','summer','winter','monsoon','festive','festival','wedding',
])

const STOPWORDS = new Set([
  'a','an','the','and','or','for','with','of','in','on','at','to','from','by','my','our','we','i',
  'is','are','be','that','this','it','as','want','need','please','create','make','build','looking',
])

/**
 * Reads three signals out of a brief.
 *
 * Only `ready` gates the button. `brand` and `product` are advisory and will be
 * wrong sometimes — a lowercase brand reads as missing, a capitalised ordinary
 * word reads as present — which is precisely why they are shown as hints and
 * never block. The detected brand is surfaced so a wrong guess is visible to the
 * user rather than hidden inside the check.
 *
 * `website` is the one exact signal: either an attached Website link or a URL in
 * the text. No guessing involved.
 */
export function briefSignals(text, references = []) {
  const trimmed = (text ?? '').trim()
  const words = trimmed.split(/\s+/).filter(Boolean)

  const brandToken =
    words.find(
      (w) =>
        /^[A-Z][A-Za-z0-9&'’.-]*$/.test(w) &&
        !NOT_BRANDS.has(w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    ) ?? null

  const content = words.filter(
    (w) => w !== brandToken && !STOPWORDS.has(w.toLowerCase().replace(/[^a-z']/g, ''))
  )

  return {
    brand: brandToken,
    product: content.length > 0,
    website: references.some((r) => r.kind === 'Website') || URL_RE.test(trimmed),
    /* The only blocking rule: a phrase rather than a single word. */
    ready: trimmed.length >= 8 && words.length >= 2,
  }
}
