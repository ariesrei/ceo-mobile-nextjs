"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { AppProfile } from "@/lib/app-profile";
import {
  brandForProfile,
  companyBrand,
  COMPANY_SPLASH,
  LANDING_BG,
} from "@/lib/brand";

const HOLD_MS = 2000;
const FADE_MS = 420;

/**
 * Read once at module scope: the variant comes from a NEXT_PUBLIC_ env var that
 * is inlined at build time, so it cannot change while the app is running. The
 * two app builds differ only in what this returns.
 */
type Props = {
  /**
   * Whether the device has already connected to a property. Resolved on the
   * server from the connect cookie so the first paint is already correct;
   * reading it from localStorage here would mismatch the server HTML.
   */
  connected?: boolean;
  appProfile?: AppProfile | null;
};

export function SplashScreen({ connected = false, appProfile = null }: Props) {
  const brand = connected
    ? brandForProfile(appProfile)
    : companyBrand();
  /**
   * Shows on every app open, every refresh, and after sign-in (full load).
   * Starting visible avoids a flash of the page underneath.
   */
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fade = window.setTimeout(() => setLeaving(true), HOLD_MS);
    const done = window.setTimeout(() => setVisible(false), HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(done);
    };
  }, []);

  if (!visible) return null;

  const splash = {
    from: brand.splashFrom || COMPANY_SPLASH.from,
    to: brand.splashTo || COMPANY_SPLASH.to,
    glow: brand.glow || COMPANY_SPLASH.glow,
  };

  return (
    <div
      className={`ceo-splash${leaving ? " is-leaving" : ""}`}
      role="status"
      aria-label={`${brand.appName} loading`}
      style={
        {
          "--splash-from": splash.from,
          "--splash-to": splash.to,
          "--splash-glow": splash.glow,
        } as CSSProperties
      }
    >
      <div
        className="ceo-splash__photo"
        style={{ backgroundImage: `url(${LANDING_BG})` }}
        aria-hidden
      />

      <div className="ceo-splash__lockup">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logo}
          alt=""
          className={connected ? "ceo-splash__badge" : "ceo-splash__mark"}
        />
        <p className="ceo-splash__title">
          <span className="ceo-splash__title-bold">CE</span> ONESOURCE
        </p>
        <p className={connected ? "ceo-splash__wordmark" : "ceo-splash__tagline"}>
          {brand.wordmark}
        </p>
      </div>

      <div className="ceo-splash__foot">
        <span className="ceo-splash__bar" aria-hidden />
        <p className="ceo-splash__loading">
          {connected ? "Loading your workspace…" : "Loading your experience…"}
        </p>
      </div>
    </div>
  );
}
