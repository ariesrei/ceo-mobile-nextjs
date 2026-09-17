"use client";

import { useEffect } from "react";

const INTERVAL_MS = 5 * 60 * 1000;

async function refreshSession() {
  try {
    await fetch("/api/auth/refresh", { method: "POST", cache: "no-store" });
  } catch {
    /* idle refresh; create/list calls still retry via /api/wp */
  }
}

/** Refresh the JWT before the 1-hour access token dies. */
export function SessionKeepAlive() {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshSession();
      }
    };
    void refreshSession();
    const id = window.setInterval(() => void refreshSession(), INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
