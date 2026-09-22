"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getClientHero,
  getClientLogo,
  getClientName,
  saveConnectConfig,
  getConnectConfig,
} from "@/lib/connect";
import { trackShortcutPath } from "@/lib/helpers/shortcuts";
import { useClientBrand } from "./ClientBrandProvider";
import { BottomNav } from "./BottomNav";
import { FastLink } from "./FastLink";
import { ArrowLeftIcon } from "./ui/Icons";

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
  showNav = true,
  narrow = false,
  layout = "default",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  clientName?: string;
  clientLogo?: string;
  showNav?: boolean;
  narrow?: boolean;
  layout?: "default" | "community";
}) {
  const brand = useClientBrand();
  const pathname = usePathname();

  useEffect(() => {
    trackShortcutPath(pathname);
  }, [pathname]);
  const [clientName, setClientName] = useState(() => {
    if (isRealClientName(clientNameProp)) return clientNameProp.trim();
    if (isRealClientName(brand.name)) return brand.name.trim();
    return "Client";
  });
  const [clientLogo, setClientLogo] = useState(() => {
    if (clientLogoProp?.trim()) return clientLogoProp.trim();
    if (brand.logo?.trim()) return brand.logo.trim();
    return "";
  });
  const [hero, setHero] = useState("");

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
    const resolvedLogo = fromPropLogo || fromBrandLogo || getClientLogo();
    setClientLogo(resolvedLogo);
    setHero(brand.hero?.trim() || getClientHero());

    if (!fromPropName && !fromBrandName) return;
    const cfg = getConnectConfig();
    if (cfg?.baseUrl) {
      saveConnectConfig(
        cfg.baseUrl,
        resolvedName !== "Client" ? resolvedName : cfg.clientName,
        resolvedLogo || cfg.clientLogo
      );
    }
  }, [clientNameProp, clientLogoProp, brand.name, brand.logo, brand.hero]);

  const community = layout === "community";

  return (
    <div
      className={`ceo-app mx-auto min-h-dvh w-full ${
        community ? "ceo-ops-page" : "ceo-warranty"
      } ${showNav ? "pb-28" : "pb-10"}${narrow ? " ceo-app--narrow" : ""}`}
    >
      {community ? (
        <header className="ceo-ops-page__head">
          {backHref ? (
            <FastLink href={backHref} className="ceo-ops-page__back" aria-label="Back">
              <ArrowLeftIcon className="h-5 w-5" />
            </FastLink>
          ) : null}
          {title ? <h1>{title}</h1> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
      ) : (
      <header
        className={`ceo-warranty-topbar${hero ? "" : " ceo-warranty-topbar--flat"}`}
      >
        {hero ? (
          <div
            className="ceo-warranty-topbar__photo"
            style={{ backgroundImage: `url(${hero})` }}
            aria-hidden
          />
        ) : null}
        <div className="ceo-warranty-topbar__shade" aria-hidden />
        <div className="ceo-warranty-topbar__row">
          {backHref ? (
            <FastLink
              href={backHref}
              className="ceo-warranty-iconbtn"
              aria-label="Back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </FastLink>
          ) : (
            <span className="ceo-warranty-iconbtn ceo-warranty-iconbtn--empty" />
          )}

          <div className="ceo-warranty-topbar__title">
            {title ? <p className="ceo-warranty-topbar__name">{title}</p> : null}
            {subtitle ? (
              <p className="ceo-warranty-topbar__sub">{subtitle}</p>
            ) : null}
          </div>

          <div className="ceo-warranty-topbar__action">
            {clientLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clientLogo}
                alt={clientName}
                className="h-7 w-auto max-w-[72px] object-contain"
              />
            ) : (
              <span className="ceo-warranty-iconbtn ceo-warranty-iconbtn--empty" />
            )}
          </div>
        </div>
      </header>
      )}

      <main className="px-[var(--app-pad)] pt-4">
        {children}
      </main>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}
