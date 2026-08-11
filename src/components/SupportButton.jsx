import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import './SupportButton.css'

/**
 * `hidden` stands the button down while the Creative Studio is on screen — its
 * sticky prompt dock occupies the same bottom corner on a phone, and two things
 * fighting for that corner is worse than briefly losing one of them.
 */
export default function SupportButton({ hidden = false }) {
  const [open, setOpen] = useState(false)

  if (hidden) return null

  return (
    <div className="support">
      {open && (
        <div className="support__card" role="dialog" aria-label="Support">
          <p className="support__title">Need a hand?</p>
          <p className="support__text">
            Our image research team can source visuals for your brief, usually within one
            working day.
          </p>
          <a className="support__link" href="#">
            Contact support
          </a>
        </div>
      )}

      <button
        type="button"
        className="support__button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close support' : 'Open support'}
      >
        {open ? (
          <X size={22} aria-hidden="true" />
        ) : (
          <MessageCircle size={22} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
