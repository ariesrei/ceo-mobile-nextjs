"use client";

import { useRouter } from "next/navigation";
import {
  type AnchorHTMLAttributes,
  MouseEvent,
  ReactNode,
  useEffect,
  useTransition,
} from "react";

export function FastLink({
  href,
  className,
  children,
  prefetch = false,
  "aria-label": ariaLabel,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
  "aria-label"?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children" | "onClick">) {
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
      {...rest}
    >
      {children}
    </a>
  );
}
