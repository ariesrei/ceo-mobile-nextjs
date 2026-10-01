import type { ParcelPhoto } from "@/lib/parcels";

type Props = {
  photos: ParcelPhoto[];
  onRemove?: (id: number) => void;
  onAdd?: () => void;
  adding?: boolean;
  disabled?: boolean;
};

export function ParcelPhotoGallery({
  photos,
  onRemove,
  onAdd,
  adding,
  disabled,
}: Props) {
  const visible = photos.filter((photo) => photo.url);
  const hero = visible[0];
  const rest = visible.slice(1);

  if (!hero && !onAdd) {
    return null;
  }

  return (
    <div className="ceo-pkg-photos">
      {hero ? (
        <figure className="ceo-pkg-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.url} alt="Package label" />
          {onRemove ? (
            <button
              type="button"
              className="ceo-pkg-hero__remove"
              disabled={disabled || adding}
              onClick={() => onRemove(hero.id)}
              aria-label="Remove photo"
            >
              ×
            </button>
          ) : null}
        </figure>
      ) : (
        <button
          type="button"
          className="ceo-pkg-hero ceo-pkg-hero--empty"
          disabled={disabled || adding}
          onClick={onAdd}
        >
          <span>{adding ? "Adding photo…" : "Add a photo"}</span>
        </button>
      )}

      {hero && (rest.length || onAdd) ? (
        <ul className="ceo-pkg-thumbs">
          {rest.map((photo) => (
            <li key={photo.id || photo.url} className="ceo-pkg-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" />
              {onRemove ? (
                <button
                  type="button"
                  className="ceo-pkg-hero__remove"
                  disabled={disabled || adding}
                  onClick={() => onRemove(photo.id)}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
          {onAdd ? (
            <li>
              <button
                type="button"
                className="ceo-pkg-thumb ceo-pkg-thumb--add"
                disabled={disabled || adding}
                onClick={onAdd}
              >
                {adding ? "…" : "+"}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
