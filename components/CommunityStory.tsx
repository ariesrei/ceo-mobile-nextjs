"use client";

import type { ReactNode } from "react";
import { FastLink } from "./FastLink";
import { ListGo, SkelLine, SkelThumb, type EmptyIcon } from "./ui/ListState";

export function storyParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function StorySkeleton({ moreLabel }: { moreLabel: string }) {
  return (
    <div className="ceo-story" role="status" aria-label="Loading">
      <div className="ceo-story__hero">
        <span className="ceo-skel ceo-story__hero-skel" />
      </div>
      <section className="ceo-story__card ceo-story__card--skel">
        <b>
          <SkelLine width="82%" />
          <SkelLine width="48%" />
        </b>
        <span className="ceo-story__meta">
          <SkelLine width="9.5rem" />
        </span>
        <div className="ceo-story__body">
          <SkelLine width="100%" />
          <SkelLine width="94%" />
          <SkelLine width="62%" />
        </div>
      </section>
      <section className="ceo-story__more">
        <h3>{moreLabel}</h3>
        <ul>
          {[0, 1].map((row) => (
            <li key={row}>
              <span className="ceo-story__more-row">
                <SkelThumb size="3.1rem" />
                <span className="ceo-story__more-body">
                  <SkelLine width="72%" />
                  <SkelLine width="46%" />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function StoryMore({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ceo-story__more">
      <h3>{title}</h3>
      <ul>{children}</ul>
    </section>
  );
}

export function StoryMoreRow({
  href,
  photo,
  title,
  meta,
  icon,
}: {
  href: string;
  photo: string;
  title: string;
  meta: string;
  icon: EmptyIcon;
}) {
  return (
    <li>
      <FastLink href={href}>
        <span className="ceo-story__thumb">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" />
          ) : (
            <span aria-hidden>{(title[0] || "A").toUpperCase()}</span>
          )}
        </span>
        <span className="ceo-story__more-body">
          <b>{title}</b>
          {meta ? <small>{meta}</small> : null}
        </span>
        <ListGo icon={icon} />
      </FastLink>
    </li>
  );
}
