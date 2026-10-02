"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function sameLocation(href: string, pathname: string) {
  try {
    const url = new URL(href, window.location.origin);
    return url.pathname === pathname && url.search === window.location.search;
  } catch {
    return false;
  }
}

export function NavProgress() {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const fromPath = useRef<string | null>(null);

  useEffect(() => {
    if (!fromPath.current || fromPath.current === pathname) return;
    fromPath.current = null;
    const timer = window.setTimeout(() => setBusy(false), 200);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      if (link.getAttribute("target") === "_blank") return;
      if (link.hasAttribute("download")) return;
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      if (sameLocation(href, pathname)) return;
      fromPath.current = pathname;
      setBusy(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => setBusy(false), 12000);
    return () => window.clearTimeout(timer);
  }, [busy]);

  if (!busy) return null;
  return (
    <div className="ceo-nav-progress" role="status" aria-live="polite" aria-label="Loading">
      <span />
    </div>
  );
}
