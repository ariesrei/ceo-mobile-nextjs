"use client";

import { useCallback, useSyncExternalStore } from "react";
import { goPath } from "@/lib/app-profile";
import { getConnectConfig, writeConnectConfig } from "@/lib/connect";
import type { ConnectResult } from "@/lib/connect-verify";
import type { ConnectConfig } from "@/lib/types";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

function snapshot(): ConnectConfig | null {
  return getConnectConfig();
}

const empty: ConnectConfig | null = null;

export function useConnectSession() {
  const config = useSyncExternalStore(subscribe, snapshot, () => empty);

  const remember = useCallback((patch: Partial<ConnectConfig> & { baseUrl: string }) => {
    const next = writeConnectConfig(patch);
    emit();
    return next;
  }, []);

  const rememberConnect = useCallback((result: ConnectResult) => {
    return remember({
      baseUrl: result.baseUrl,
      clientName: result.clientName,
      clientLogo: result.clientLogo,
      clientHero: result.clientHero,
      clientTagline: result.clientTagline,
      planKey: result.planKey,
      appProfile: result.appProfile,
    });
  }, [remember]);

  const afterConnectPath = useCallback((result: ConnectResult) => {
    return goPath(result.appProfile);
  }, []);

  return { config, remember, rememberConnect, afterConnectPath };
}
