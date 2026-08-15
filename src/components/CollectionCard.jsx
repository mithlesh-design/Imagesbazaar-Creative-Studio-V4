import './CollectionCard.css'

export default function CollectionCard({ collection, onSelect, priority = false }) {
  const { title, image, image2x, alt } = collection

  return (
    <li className="card">
      <button
        type="button"
        className="card__button"
        onClick={() => onSelect(collection)}
        aria-label={`Open ${title} in the Creative Editor`}
      >
        <span className="card__media">
          <img
            className="card__img"
            src={image}
            srcSet={`${image} 400w, ${image2x} 800w`}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
            width={400}
            height={400}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        </span>
        <span className="card__title">{title}</span>
      </button>
    </li>
  )
}
