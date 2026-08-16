import './CollectionCard.css'

/**
 * `showTitle` is false for generated variants, where the caption named a stock
 * collection rather than anything about the generated image. It stays true for
 * search results, where the title is how you tell one library photo from
 * another. The button's `aria-label` carries the title either way, so hiding it
 * changes what is seen, not what is announced.
 */
export default function CollectionCard({
  collection,
  onSelect,
  priority = false,
  showTitle = true,
}) {
  const { title, image, image2x, alt } = collection

  return (
    <li className="card">
      <button
        type="button"
        className={`card__button${showTitle ? '' : ' card__button--bare'}`}
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
        {showTitle && <span className="card__title">{title}</span>}
      </button>
    </li>
  )
}
