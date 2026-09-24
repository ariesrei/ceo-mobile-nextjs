"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useConnectSession } from "@/hooks/useConnectSession";
import type { AppProfile } from "@/lib/app-profile";
import { brandForProfile, LANDING_BG } from "@/lib/brand";

export function AuthScreen({
  fallbackLogo = "",
  fallbackName = "",
  fallbackHero = "",
  fallbackTagline = "",
  fallbackBaseUrl = "",
  appProfile = null,
  children,
}: {
  fallbackLogo?: string;
  fallbackName?: string;
  fallbackHero?: string;
  fallbackTagline?: string;
  fallbackBaseUrl?: string;
  appProfile?: AppProfile | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const brand = brandForProfile(appProfile || "warranty");
  const { config, remember } = useConnectSession();
  const [liveHero, setLiveHero] = useState("");

  const baseUrl = config?.baseUrl || fallbackBaseUrl || "";
  const propertyName = fallbackName || config?.clientName || "";
  const propertyLogo = fallbackLogo || config?.clientLogo || "";
  const propertyHero = liveHero || fallbackHero || config?.clientHero || "";
  const tagline = fallbackTagline || config?.clientTagline || "";

  useEffect(() => {
    if (config === null) return;
    if (!config?.baseUrl && !fallbackBaseUrl) {
      router.replace("/connect");
      return;
    }
    if (config && !config.clientHero && fallbackHero && (config.baseUrl || fallbackBaseUrl)) {
      remember({
        baseUrl: config.baseUrl || fallbackBaseUrl,
        clientHero: fallbackHero,
        clientTagline: fallbackTagline || config.clientTagline,
      });
    }
  }, [config, fallbackBaseUrl, fallbackHero, fallbackTagline, remember, router]);

  useEffect(() => {
    if (!baseUrl) return;
    const url = `${baseUrl.replace(/\/+$/, "")}/wp-json/onesource/v1/mobile/branding`;
    let cancelled = false;
    fetch(url, { headers: { Accept: "application/json" } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { client_hero?: string } | null) => {
        const next = String(data?.client_hero || "").trim();
        if (cancelled || !next) return;
        setLiveHero(next);
        remember({ baseUrl, clientHero: next });
      })
      .catch(() => {
        /* Cookie/localStorage hero stays if WordPress is unreachable. */
      });
    return () => {
      cancelled = true;
    };
  }, [baseUrl, remember]);

  return (
    <div className="ceo-login">
      <div
        className="ceo-login__hero"
        style={{
          backgroundImage: propertyHero
            ? `url(${propertyHero}), url(${LANDING_BG})`
            : `url(${LANDING_BG})`,
        }}
        aria-hidden
      />

      <header className="ceo-login__brand">
        <div className="ceo-login__lockup">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logo} alt="" className="ceo-login__badge-mark" />
          <div className="ceo-login__lockup-text">
            <p className="ceo-login__company-name">
              <span className="ceo-login__company-name-bold">CE</span> ONESOURCE
            </p>
            <p className="ceo-login__company-variant">{brand.wordmark}</p>
          </div>
        </div>
      </header>

      <section className="ceo-login__property">
        {propertyLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={propertyLogo}
            alt=""
            className="ceo-login__property-logo"
          />
        ) : null}
        {propertyName ? (
          <h1 className="ceo-login__property-name">{propertyName}</h1>
        ) : null}
        {tagline ? (
          <p className="ceo-login__property-tagline">{tagline}</p>
        ) : null}
        <p className="ceo-login__mode">{brand.loginBadge}</p>
      </section>

      <div className="ceo-login__card">{children}</div>
    </div>
  );
}
