import { Info } from 'lucide-react'
import { briefNotice } from '../data/briefNotice'
import './BriefNotice.css'

/**
 * Shown under the prompt box until the brief carries a brand and a product.
 *
 * `role="status"` with `aria-live="polite"`, not `role="alert"`: nothing has
 * gone wrong. The user simply has not finished yet, and an assertive alert on
 * arrival — before they have typed a character — would be alarming for a state
 * that is the normal starting point.
 */
export default function BriefNotice() {
  return (
    <div className="briefnotice" role="status" aria-live="polite">
      <Info className="briefnotice__icon" size={16} aria-hidden="true" />
      <div className="briefnotice__text">
        <p className="briefnotice__title">{briefNotice.title}</p>
        <p className="briefnotice__body">{briefNotice.body}</p>
        <p className="briefnotice__tip">{briefNotice.tip}</p>
      </div>
    </div>
  )
}
