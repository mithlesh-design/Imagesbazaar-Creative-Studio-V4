import { popularSearches } from '../data/popularSearches'
import './PopularSearches.css'

export default function PopularSearches({ onSelect }) {
  return (
    <section className="chips" aria-labelledby="chips-heading">
      <div className="container">
        <h2 className="section-heading" id="chips-heading">
          Popular Searches
        </h2>

        <ul className="chips__list">
          {popularSearches.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className="chips__chip"
                onClick={() => onSelect(item.query)}
                aria-label={`Search for ${item.query}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
