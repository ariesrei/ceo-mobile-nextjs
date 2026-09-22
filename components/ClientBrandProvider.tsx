"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { getConnectConfig, saveConnectConfig } from "@/lib/connect";

type Branding = {
  name: string;
  logo: string;
  hero: string;
};

const ClientBrandContext = createContext<Branding>({
  name: "",
  logo: "",
  hero: "",
});

export function useClientBrand(): Branding {
  return useContext(ClientBrandContext);
}

export function ClientBrandProvider({
  name = "",
  logo = "",
  hero = "",
  children,
}: {
  name?: string;
  logo?: string;
  hero?: string;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      name: name.trim(),
      logo: logo.trim(),
      hero: hero.trim(),
    }),
    [name, logo, hero]
  );

  useEffect(() => {
    if (!value.name || value.name === "Client") return;

    const cfg = getConnectConfig();
    if (cfg?.baseUrl) {
      saveConnectConfig(cfg.baseUrl, value.name, value.logo || cfg.clientLogo);
    }

    void fetch("/api/client-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: value.name,
        clientLogo: value.logo,
      }),
    }).catch(() => undefined);
  }, [value.name, value.logo]);

  return (
    <ClientBrandContext.Provider value={value}>
      {children}
    </ClientBrandContext.Provider>
  );
}
