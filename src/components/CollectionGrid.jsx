import { collections } from '../data/collections'
import CollectionCard from './CollectionCard'
import './CollectionGrid.css'

export default function CollectionGrid({ onSelect }) {
  return (
    <section className="collections" id="collections" aria-labelledby="collections-heading">
      <div className="container">
        <h2 className="section-heading" id="collections-heading">
          Popular Collections
        </h2>

        <ul className="collections__grid">
          {collections.map((collection, i) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onSelect={onSelect}
              /* The first row is close to the fold — load it eagerly so it
                 doesn't pop in on fast connections. */
              priority={i < 4}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
