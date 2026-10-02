"use client";

import { useEffect, useState } from "react";
import {
  listClassifieds,
  timeAgo,
  type ClassifiedItem,
} from "@/lib/helpers/classifieds";
import {
  StoryMore,
  StoryMoreRow,
  StorySkeleton,
  storyParagraphs,
} from "./CommunityStory";
import { EmptyState } from "./ui/ListState";
import { ClockIcon } from "./ui/Icons";

const CATEGORY_LABEL: Record<string, string> = {
  for_sale: "For sale",
  wanted: "Wanted",
  free: "Free",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] || "Listing";
}

export function ClassifiedDetail({ classifiedId }: { classifiedId: number }) {
  const [item, setItem] = useState<ClassifiedItem | null>(null);
  const [more, setMore] = useState<ClassifiedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classifiedId) {
      setLoading(false);
      return;
    }
    listClassifieds(40)
      .then((data) => {
        if (!data.ok) return;
        const current =
          data.items.find((row) => row.id === classifiedId) || null;
        setItem(current);
        const rest = data.items.filter((row) => row.id !== classifiedId);
        const same = current
          ? rest.filter((row) => row.category === current.category)
          : [];
        setMore([...same, ...rest.filter((row) => !same.includes(row))].slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, [classifiedId]);

  if (loading) return <StorySkeleton moreLabel="More listings" />;
  if (!item) {
    return (
      <EmptyState icon="tag" subtitle="It may have been removed or the link is old.">
        Listing not found
      </EmptyState>
    );
  }

  const rawBody = item.description || item.excerpt;
  const firstLine = rawBody.split("\n")[0]?.trim() || "";
  const price =
    item.price.trim() || (/^\$/.test(firstLine) ? firstLine : "");
  const paragraphs = storyParagraphs(
    price && firstLine === price
      ? rawBody.replace(firstLine, "").trim()
      : rawBody
  );
  const category = item.category || "for_sale";

  return (
    <article className="ceo-story">
      <div className={`ceo-story__hero is-${category}`}>
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo} alt="" />
        ) : (
          <span className="ceo-story__mark" aria-hidden>
            {(item.title[0] || "L").toUpperCase()}
          </span>
        )}
        <span className={`ceo-story__chip is-${category}`}>
          {categoryLabel(category)}
        </span>
      </div>

      <section className="ceo-story__card">
        <h2>{item.title}</h2>
        {price ? <p className="ceo-story__price">{price}</p> : null}
        {item.date ? (
          <p className="ceo-story__meta">
            <ClockIcon className="ceo-story__meta-icon" />
            <span>{timeAgo(item.date)}</span>
          </p>
        ) : null}
        {paragraphs.length ? (
          <div className="ceo-story__body">
            {paragraphs.map((part) => (
              <p key={part}>{part}</p>
            ))}
          </div>
        ) : null}
      </section>

      {more.length ? (
        <StoryMore title="More listings">
          {more.map((row) => (
            <StoryMoreRow
              key={row.id}
              href={`/account/classifieds/${row.id}`}
              photo={row.photo}
              title={row.title}
              meta={[
                row.price.trim() ||
                  (row.description.split("\n")[0] || "").trim(),
                timeAgo(row.date),
              ]
                .filter(Boolean)
                .join(" · ")}
              icon="tag"
            />
          ))}
        </StoryMore>
      ) : null}
    </article>
  );
}
