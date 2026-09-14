"use client";

import { useRouter } from "next/navigation";
import { MouseEvent, ReactNode, useEffect } from "react";
import { useTransition } from "react";

export function FastLink({
  href,
  className,
  children,
  prefetch = false,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
  "aria-label"?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  useEffect(() => {
    if (prefetch) router.prefetch(href);
  }, [href, prefetch, router]);

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    start(() => router.push(href));
  }

  return (
    <a
      href={href}
      className={`${className || ""}${pending ? " is-pending" : ""}`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
