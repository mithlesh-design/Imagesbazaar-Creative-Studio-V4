import { ArrowRight } from 'lucide-react'
import { hero } from '../data/collections'
import './HeroBanner.css'

export default function HeroBanner() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__frame">
        <img
          className="hero__img"
          src={hero.src}
          srcSet={hero.srcSet}
          sizes="100vw"
          width={hero.width}
          height={hero.height}
          alt={hero.alt}
          fetchPriority="high"
          decoding="async"
        />

        {/* Overlay sits in the photograph's negative space on desktop and
            becomes a strip below the image on mobile (DESIGN.md §7). */}
        <div className="hero__promo">
          <p className="hero__promo-figure" id="hero-heading">
            100K+
          </p>
          <p className="hero__promo-label">New Indian visuals</p>
          <a className="hero__promo-cta" href="#collections">
            Explore now
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
