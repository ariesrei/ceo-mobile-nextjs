"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  getClientLogo,
  getClientName,
  saveConnectConfig,
  getConnectConfig,
} from "@/lib/connect";
import { useClientBrand } from "./ClientBrandProvider";
import { Button } from "./ui/Button";

function isRealClientName(value?: string | null): value is string {
  const name = (value || "").trim();
  return Boolean(name) && name !== "Client";
}

export function AppShell({
  title,
  subtitle,
  children,
  backHref,
  clientName: clientNameProp,
  clientLogo: clientLogoProp,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  /** Server-provided client/site name when available. */
  clientName?: string;
  /** Server-provided custom logo URL when available. */
  clientLogo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const showLogout = pathname.startsWith("/account");
  const brand = useClientBrand();

  const [clientName, setClientName] = useState(() => {
    if (isRealClientName(clientNameProp)) return clientNameProp.trim();
    if (isRealClientName(brand.name)) return brand.name.trim();
    if (typeof window !== "undefined") {
      const stored = getClientName();
      if (isRealClientName(stored)) return stored;
    }
    return "Client";
  });
  const [clientLogo, setClientLogo] = useState(() => {
    if (clientLogoProp?.trim()) return clientLogoProp.trim();
    if (brand.logo?.trim()) return brand.logo.trim();
    if (typeof window !== "undefined") return getClientLogo();
    return "";
  });

  useEffect(() => {
    const fromPropName = isRealClientName(clientNameProp)
      ? clientNameProp.trim()
      : "";
    const fromBrandName = isRealClientName(brand.name) ? brand.name.trim() : "";
    const fromStorageName = getClientName();
    const resolvedName =
      fromPropName ||
      fromBrandName ||
      (isRealClientName(fromStorageName) ? fromStorageName : "") ||
      "Client";
    setClientName(resolvedName);

    const fromPropLogo = clientLogoProp?.trim() || "";
    const fromBrandLogo = brand.logo?.trim() || "";
    const fromStorageLogo = getClientLogo();
    const resolvedLogo = fromPropLogo || fromBrandLogo || fromStorageLogo;
    setClientLogo(resolvedLogo);

    if (!fromPropName && !fromBrandName) return;

    const cfg = getConnectConfig();
    if (cfg?.baseUrl) {
      saveConnectConfig(
        cfg.baseUrl,
        resolvedName !== "Client" ? resolvedName : cfg.clientName,
        resolvedLogo || cfg.clientLogo
      );
    }
  }, [clientNameProp, clientLogoProp, brand.name, brand.logo]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-10 pt-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {backHref ? (
            <Link
              href={backHref}
              className="mb-2 inline-block text-sm text-[var(--muted)] hover:text-[var(--ink)]"
            >
              ← Back
            </Link>
          ) : null}
          {clientLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clientLogo}
              alt={clientName !== "Client" ? clientName : "Property logo"}
              className="h-9 w-auto max-w-[160px] object-contain"
            />
          ) : (
            <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              {clientName}
            </p>
          )}
          <h1 className="font-display mt-1 text-3xl tracking-tight text-[var(--ink)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
        {showLogout ? (
          <Button variant="ghost" type="button" onClick={logout} className="shrink-0 px-3 py-2">
            Log out
          </Button>
        ) : null}
      </header>
      <main>{children}</main>
    </div>
  );
}
