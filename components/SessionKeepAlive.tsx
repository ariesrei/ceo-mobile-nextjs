"use client";

import { useEffect } from "react";
import { getConnectConfig } from "@/lib/connect";
import {
  hydrateBrowserSession,
  installWpDirectFetch,
  refreshBrowserSession,
} from "@/lib/browser-wp";

const INTERVAL_MS = 5 * 60 * 1000;

async function refreshFromDevice() {
  installWpDirectFetch();
  await hydrateBrowserSession();
  const baseUrl = getConnectConfig()?.baseUrl;
  if (!baseUrl) return;
  await refreshBrowserSession(baseUrl);
}

async function refreshSession() {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      cache: "no-store",
    });
    if (res.ok) return;
    // Testdev WAF blocks Vercel; renew from the browser instead.
    if (res.status === 401 || res.status === 403 || res.status >= 500) {
      await refreshFromDevice();
    }
  } catch {
    await refreshFromDevice().catch(() => undefined);
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
