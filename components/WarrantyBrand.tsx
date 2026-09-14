"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type WarrantyBrand = {
  /** Property name, e.g. "Pacific Vista 2". */
  name: string;
  /** Property logo from WordPress. */
  logo: string;
  /** Property background photo. Same `client_hero` the /account home hero uses. */
  hero: string;
  /** Greeting name from /app/me, already loaded by the warranties layout. */
  firstName: string;
};

const EMPTY: WarrantyBrand = { name: "", logo: "", hero: "", firstName: "" };

const WarrantyBrandContext = createContext<WarrantyBrand>(EMPTY);

export function useWarrantyBrand(): WarrantyBrand {
  return useContext(WarrantyBrandContext);
}

export function WarrantyBrandProvider({
  name = "",
  logo = "",
  hero = "",
  firstName = "",
  children,
}: {
  name?: string;
  logo?: string;
  hero?: string;
  firstName?: string;
  children: ReactNode;
}) {
  const [cachedName, setCachedName] = useState("");
  useEffect(() => {
    if (firstName.trim()) return;
    try {
      setCachedName(sessionStorage.getItem("ceo_first_name")?.trim() || "");
    } catch {
      /* private mode */
    }
  }, [firstName]);

  const value = useMemo(
    () => ({
      name: name.trim(),
      logo: logo.trim(),
      hero: hero.trim(),
      firstName: firstName.trim() || cachedName,
    }),
    [name, logo, hero, firstName, cachedName]
  );

  return (
    <WarrantyBrandContext.Provider value={value}>
      {children}
    </WarrantyBrandContext.Provider>
  );
}

/** "Pacific Vista at Kailua" reads as two lines in the header lockup. */
export function splitPropertyName(name: string): {
  primary: string;
  secondary: string;
} {
  const trimmed = name.trim();
  if (!trimmed || trimmed === "Client") {
    return { primary: "YOUR PROPERTY", secondary: "" };
  }
  const atMatch = trimmed.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    return {
      primary: atMatch[1].toUpperCase(),
      secondary: `AT ${atMatch[2].toUpperCase()}`,
    };
  }
  return { primary: trimmed.toUpperCase(), secondary: "" };
}
