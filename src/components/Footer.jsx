import { footerColumns, socialLinks } from '../data/navigation'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <img
              src="/brand/imagesbazaar-logo.svg"
              alt="ImagesBazaar"
              width={667}
              height={153}
              className="footer__logo"
              loading="lazy"
            />
            <p className="footer__tagline">
              Authentic Indian photography for brands, publishers and agencies.
            </p>
          </div>

          <nav className="footer__cols" aria-label="Footer">
            {footerColumns.map((col) => (
              <div className="footer__col" key={col.title}>
                <h2 className="footer__col-title">{col.title}</h2>
                <ul className="footer__list">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a className="footer__link" href={link.href}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">© 2026 ImagesBazaar. All rights reserved.</p>

          <ul className="footer__social">
            {socialLinks.map((s) => (
              <li key={s.label}>
                <a className="footer__link" href={s.href}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
