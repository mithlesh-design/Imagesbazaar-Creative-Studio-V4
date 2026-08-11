import { useRef } from 'react'
import { X } from 'lucide-react'
import { browseCategories } from '../data/navigation'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useFocusTrap } from '../hooks/useFocusTrap'
import './MobileMenu.css'

export default function MobileMenu({ open, onClose, onSelectCategory }) {
  const panelRef = useRef(null)

  useLockBodyScroll(open)
  useFocusTrap(panelRef, open, onClose)

  if (!open) return null

  return (
    <div className="menu">
      <div className="menu__backdrop" onClick={onClose} aria-hidden="true" />

      <div
        className="menu__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Browse categories"
        tabIndex={-1}
      >
        <div className="menu__head">
          <span className="menu__title">Browse Categories</span>
          <button
            type="button"
            className="menu__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Categories">
          <ul className="menu__list">
            {browseCategories.map((cat) => (
              <li key={cat.label}>
                <button
                  type="button"
                  className="menu__item"
                  onClick={() => onSelectCategory(cat.query)}
                >
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="menu__foot">
          <a className="menu__item menu__item--plain" href="#">
            Pricing
          </a>
          <a className="menu__signin" href="#">
            Sign In
          </a>
        </div>
      </div>
    </div>
  )
}
