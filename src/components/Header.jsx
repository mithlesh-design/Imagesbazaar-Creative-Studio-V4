import { Menu } from 'lucide-react'
import './Header.css'

export default function Header({ onOpenMenu }) {
  return (
    <header className="header">
      <div className="header__inner container">
        <div className="header__left">
          <button
            type="button"
            className="header__menu"
            onClick={onOpenMenu}
            aria-label="Browse categories"
            aria-haspopup="dialog"
          >
            <Menu size={26} strokeWidth={2.4} aria-hidden="true" />
            <span className="header__menu-label">Browse Categories</span>
          </button>
        </div>

        <a className="header__brand" href="#" aria-label="ImagesBazaar home">
          <img
            src="/brand/imagesbazaar-logo.svg"
            alt="ImagesBazaar"
            width={667}
            height={153}
            className="header__logo"
          />
        </a>

        <div className="header__right">
          <a className="header__link" href="#">
            Pricing
          </a>
          <a className="header__signin" href="#">
            Sign In
          </a>
        </div>
      </div>
    </header>
  )
}
