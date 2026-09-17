"use client";

import { useEffect } from "react";
import { installWpDirectFetch } from "@/lib/browser-wp";

let installed = false;

function ensureInstalled() {
  if (installed || typeof window === "undefined") return;
  installWpDirectFetch();
  installed = true;
}

/** Rewrites same-origin /api/wp calls to WordPress before child effects run. */
export function WpDirectFetch() {
  ensureInstalled();
  useEffect(() => {
    ensureInstalled();
  }, []);
  return null;
}
