"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { clearBrowserTokens } from "@/lib/browser-session";

export function useLogout() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    clearBrowserTokens();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* tokens are already cleared */
    }
    router.push("/login");
    router.refresh();
  }

  return { loggingOut, logout };
}

export function LogoutOverlay({ show }: { show: boolean }) {
  if (!show || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="ceo-logout-veil"
      role="status"
      aria-live="assertive"
      aria-busy="true"
    >
      <div className="ceo-logout-veil__card">
        <span className="ceo-logout-spin" aria-hidden />
        <p className="ceo-logout-veil__copy">Logging out…</p>
      </div>
    </div>,
    document.body
  );
}
