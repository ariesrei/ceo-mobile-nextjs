"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  appBrand,
  COMPANY_MARK,
  COMPANY_SPLASH,
  COMPANY_TAGLINE,
  LANDING_BG,
} from "@/lib/brand";

const HOLD_MS = 2000;
const FADE_MS = 420;

/**
 * Read once at module scope: the variant comes from a NEXT_PUBLIC_ env var that
 * is inlined at build time, so it cannot change while the app is running. The
 * two app builds differ only in what this returns.
 */
const brand = appBrand();

type Props = {
  /**
   * Whether the device has already connected to a property. Resolved on the
   * server from the connect cookie so the first paint is already correct;
   * reading it from localStorage here would mismatch the server HTML.
   */
  connected?: boolean;
};

export function SplashScreen({ connected = false }: Props) {
  /**
   * Shows on every app open and every refresh. Starting visible rather than
   * revealing it from an effect avoids a flash of the page underneath. It lives
   * in the root layout, which only mounts on a full page load, so moving
   * between screens inside the app never re-triggers it.
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

  /*
   * Before a property is chosen the app is still company-level, so it shows the
   * CE OneSource mark. Once connected it belongs to a property and switches to
   * the Operations (or Warranty) badge, matching the connect and login screens.
   */
  const splash = connected
    ? {
        from: brand.splashFrom || COMPANY_SPLASH.from,
        to: brand.splashTo || COMPANY_SPLASH.to,
        glow: brand.glow || COMPANY_SPLASH.glow,
      }
    : COMPANY_SPLASH;

  return (
    <div
      className={`ceo-splash${leaving ? " is-leaving" : ""}`}
      role="status"
      aria-label={`${connected ? brand.appName : "CE OneSource"} loading`}
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
        {connected ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo} alt="" className="ceo-splash__badge" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={COMPANY_MARK} alt="" className="ceo-splash__mark" />
        )}
        <p className="ceo-splash__title">
          <span className="ceo-splash__title-bold">CE</span> ONESOURCE
        </p>
        {connected ? (
          <p className="ceo-splash__wordmark">{brand.wordmark}</p>
        ) : (
          <p className="ceo-splash__tagline">{COMPANY_TAGLINE}</p>
        )}
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
