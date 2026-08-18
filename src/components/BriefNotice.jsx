import { Check, Circle, X } from 'lucide-react'
import { briefNotice as copy } from '../data/briefNotice'
import './BriefNotice.css'

/**
 * A checklist of what the brief carries, under the prompt box.
 *
 * Two tiers, and the distinction matters: only `ready` — a phrase rather than a
 * single word — actually disables Generate. Brand and product are advisory
 * guesses that can be wrong in both directions, so they are shown as hints and
 * never block. The detected brand is printed so a wrong guess is visible rather
 * than buried in a check nobody can see.
 *
 * `role="status"` with `aria-live="polite"`, not `role="alert"`: nothing has
 * gone wrong. An assertive alert before the user has typed anything would
 * announce an error for what is simply the starting state.
 */
function Row({ state, label, hint }) {
  const Icon = state === 'yes' ? Check : state === 'no' ? X : Circle
  return (
    <li className={`briefnotice__row is-${state}`}>
      <Icon className="briefnotice__mark" size={13} strokeWidth={2.5} aria-hidden="true" />
      <span className="briefnotice__label">{label}</span>
      <span className="briefnotice__hint">{hint}</span>
    </li>
  )
}

export default function BriefNotice({ signals }) {
  const { brand, product, website, ready } = signals

  return (
    <div className="briefnotice" role="status" aria-live="polite">
      <p className="briefnotice__title">
        {ready ? copy.hintTitle : copy.blockedTitle}
      </p>

      <ul className="briefnotice__list">
        <Row
          state={brand ? 'yes' : 'no'}
          label={copy.brandLabel}
          hint={brand ? brand : copy.brandMissing}
        />
        <Row
          state={product ? 'yes' : 'no'}
          label={copy.productLabel}
          hint={product ? 'described' : copy.productMissing}
        />
        <Row
          state={website ? 'yes' : 'maybe'}
          label={copy.websiteLabel}
          hint={website ? copy.websiteFound : copy.websiteMissing}
        />
      </ul>
    </div>
  )
}
