import { Mail, Phone, MessageCircle, Facebook, Linkedin, Twitter, MessageSquare } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer-v2">
      <div className="container footer-v2__container">
        {/* Top Content Row */}
        <div className="footer-v2__top">
          {/* Contact Details & Social Links */}
          <div className="footer-v2__contact">
            <div className="footer-v2__contact-item">
              <Mail className="footer-v2__icon" size={20} strokeWidth={2} />
              <a href="mailto:info@imagesbazaar.com" className="footer-v2__link-text">
                info@imagesbazaar.com
              </a>
            </div>

            <div className="footer-v2__contact-item">
              <Phone className="footer-v2__icon" size={20} strokeWidth={2} />
              <span className="footer-v2__text">
                <strong>All India Toll Free:</strong> 1800-11-6869
              </span>
            </div>

            <div className="footer-v2__contact-item">
              <MessageCircle className="footer-v2__icon" size={20} strokeWidth={2} />
              <span className="footer-v2__text">
                <strong>Whatsapp Us:</strong> +919911366666
              </span>
            </div>

            <div className="footer-v2__social">
              <h4 className="footer-v2__social-title">Follow Us</h4>
              <div className="footer-v2__social-btns">
                <a href="#" className="footer-v2__social-btn" aria-label="Facebook">
                  <Facebook size={18} fill="#0a53be" stroke="none" />
                </a>
                <a href="#" className="footer-v2__social-btn" aria-label="LinkedIn">
                  <Linkedin size={18} fill="#0a53be" stroke="none" />
                </a>
                <a href="#" className="footer-v2__social-btn" aria-label="Twitter">
                  <Twitter size={18} fill="#0a53be" stroke="none" />
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Links Columns */}
          <div className="footer-v2__nav">
            <div className="footer-v2__col">
              <h3 className="footer-v2__col-title">Company Info</h3>
              <ul className="footer-v2__list">
                <li><a href="#">Home</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Testimonials</a></li>
                <li><a href="#">Image Research</a></li>
              </ul>
            </div>

            <div className="footer-v2__col">
              <h3 className="footer-v2__col-title">Learn More</h3>
              <ul className="footer-v2__list">
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Licensing</a></li>
                <li><a href="#">Videos</a></li>
                <li><a href="#">Terms of Use</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>

            <div className="footer-v2__col">
              <h3 className="footer-v2__col-title">Need Help?</h3>
              <ul className="footer-v2__list">
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Search Tips</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Technical</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-v2__bottom">
          <p className="footer-v2__copyright">
            © https://www.imagesbazaar.com. A division of Mash Audio Visuals Pvt. Ltd. All rights reserved.
          </p>

          <div className="footer-v2__sub-bar">
            <div className="footer-v2__legal">
              <a href="#">Terms of Use</a>
              <span className="footer-v2__pipe">|</span>
              <a href="#">Privacy Policy</a>
              <span className="footer-v2__pipe">|</span>
              <a href="#">FAQs</a>
            </div>

            <div className="footer-v2__badges">
              <div className="badge badge--visa">VISA</div>
              <div className="badge badge--mastercard">
                <span className="mc-circle mc-red"></span>
                <span className="mc-circle mc-yellow"></span>
              </div>
              <div className="badge badge--amex">AMEX</div>
              <div className="badge badge--rupay">
                <span className="rupay-text">RuPay</span>
                <span className="rupay-arrow"></span>
              </div>
              <div className="badge badge--comodo">
                <span className="comodo-lock">🔒</span>
                <span className="comodo-text">COMODO SECURED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat FAB */}
      <button type="button" className="footer-v2__chat-fab" aria-label="Live Chat Support">
        <MessageSquare size={22} fill="white" stroke="none" />
      </button>
    </footer>
  )
}
