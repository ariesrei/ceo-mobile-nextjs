"use client";

import Link from "next/link";
import {
  type AnchorHTMLAttributes,
  ReactNode,
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
} & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
>) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </Link>
  );
}
