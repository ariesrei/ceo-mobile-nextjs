"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FastLink } from "./FastLink";
import { listAmenities, type AmenityItem } from "@/lib/helpers/amenities";
import { ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

export function AmenityPhoto({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const [srcOverride, setSrcOverride] = useState("");
  const url = srcOverride || src;
  if (!url || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={title}
      onError={() => {
        if (url.startsWith("http://")) {
          setSrcOverride(`https://${url.slice("http://".length)}`);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

export function AmenityGallery({
  photos,
  title,
}: {
  photos: string[];
  title: string;
}) {
  const urls = photos.filter(Boolean);
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  if (!urls.length) return null;
  if (urls.length === 1) {
    return <AmenityPhoto src={urls[0]} title={title} />;
  }

  return (
    <div className="ceo-amenity__gallery">
      <div
        ref={scroller}
        className="ceo-amenity__gallery-track"
        onScroll={(e) => {
          const el = e.currentTarget;
          const next = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
          setIndex(next);
        }}
      >
        {urls.map((src, i) => (
          <div key={`${src}-${i}`} className="ceo-amenity__gallery-slide">
            <AmenityPhoto src={src} title={`${title} photo ${i + 1}`} />
          </div>
        ))}
      </div>
      <div className="ceo-amenity__dots" role="tablist" aria-label={`${title} photos`}>
        {urls.map((_, i) => (
          <button
            key={i}
            type="button"
            className={i === index ? "is-on" : undefined}
            aria-label={`Photo ${i + 1}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const el = scroller.current;
              if (!el) return;
              el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function AmenitiesList() {
  const [items, setItems] = useState<AmenityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listAmenities()
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => !q || item.title.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="ceo-amenity">
      {pending || items.length > 0 ? (
        <label className="ceo-amenity__search">
          <span className="sr-only">Search amenities</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search amenities"
          />
        </label>
      ) : null}

      {pending ? (
        <ListSkeleton rows={3} height={196} variant="block" />
      ) : (
        <PaginatedList
          items={visible}
          listClassName="ceo-amenity__list"
          emptyIcon={query.trim() ? "search" : "calendar"}
          emptyMessage={query.trim() ? "No matching amenities" : "No amenities yet"}
          emptySubtitle={
            query.trim()
              ? "Try another search."
              : "When amenities are added, they will appear here."
          }
          getKey={(item) => item.id}
          renderItem={(item) => (
            <article className="ceo-amenity__card">
              <div className="ceo-amenity__photo">
                <AmenityGallery
                  photos={item.photos.length ? item.photos : item.photo ? [item.photo] : []}
                  title={item.title}
                />
              </div>
              <div className="ceo-amenity__body">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.hours}</p>
                </div>
                <FastLink
                  href={`/account/reservations/new?amenity=${item.id}`}
                  className="ceo-amenity__reserve"
                >
                  Reserve
                </FastLink>
              </div>
            </article>
          )}
        />
      )}
    </div>
  );
}
