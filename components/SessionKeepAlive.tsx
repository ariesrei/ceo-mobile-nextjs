"use client";

import { useEffect } from "react";
import { refreshAppSession, sessionNeedsRefresh } from "@/lib/browser-wp";

const INTERVAL_MS = 5 * 60 * 1000;

async function tick() {
  if (!sessionNeedsRefresh()) return;
  await refreshAppSession();
}

/** Refresh the JWT before the 1-hour access token dies. */
export function SessionKeepAlive() {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void tick();
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
