"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBusyState } from "@/hooks/useBusyState";
import { useConnectSession } from "@/hooks/useConnectSession";
import type { AppProfile } from "@/lib/app-profile";
import { brandForProfile, LANDING_BG, postLoginPath } from "@/lib/brand";
import {
  clearBrowserTokens,
  loginFromProperty,
  saveBrowserTokens,
} from "@/lib/browser-wp";
import { clearConnectConfig } from "@/lib/connect";
import { publicWpErrorMessage } from "@/lib/wp-error";
import { AuthField } from "./auth/AuthField";
import { Button } from "./ui/Button";
import { LockIcon, UserIcon } from "./ui/Icons";

type Props = {
  fallbackLogo?: string;
  fallbackName?: string;
  fallbackHero?: string;
  fallbackTagline?: string;
  fallbackBaseUrl?: string;
  appProfile?: AppProfile | null;
};

export function LoginForm({
  fallbackLogo = "",
  fallbackName = "",
  fallbackHero = "",
  fallbackTagline = "",
  fallbackBaseUrl = "",
  appProfile = null,
}: Props) {
  const router = useRouter();
  const brand = brandForProfile(appProfile || "warranty");
  const { config, remember } = useConnectSession();
  const busy = useBusyState();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingProperty, setChangingProperty] = useState(false);
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
    if (!config.clientHero && fallbackHero) {
      remember({
        baseUrl: config.baseUrl,
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

  async function onChangeProperty() {
    if (changingProperty) return;
    setChangingProperty(true);
    clearConnectConfig();
    clearBrowserTokens();
    try {
      await fetch("/api/connect", { method: "DELETE" });
    } catch {
      /* Still leave so a failed reset cannot trap the user on login. */
    }
    window.location.assign("/connect");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    busy.start();
    try {
      const verified = await loginFromProperty(baseUrl, username, password);
      if (!verified.ok && !verified.network) {
        busy.fail(verified.error || "Login failed.");
        return;
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          verified.ok
            ? {
                baseUrl,
                browserVerified: true,
                access_token: verified.data.access_token,
                refresh_token: verified.data.refresh_token,
                expires_in: verified.data.expires_in,
                user: verified.data.user,
              }
            : { username, password, baseUrl }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        busy.fail(
          publicWpErrorMessage(
            data.message || (!verified.ok ? verified.error : ""),
            "Login failed."
          )
        );
        return;
      }
      if (verified.ok) {
        saveBrowserTokens(
          verified.data.access_token,
          verified.data.refresh_token
        );
      }
      if (data.user?.client_name && baseUrl) {
        remember({
          baseUrl,
          clientName: data.user.client_name,
          clientLogo: data.user.client_logo,
          clientHero: data.user.client_hero,
          clientTagline: data.user.client_tagline,
          planKey: data.user.plan_key,
          appProfile: data.user.app_profile || data.appProfile,
        });
      }
      window.location.assign(
        postLoginPath(data.user?.app_profile || data.appProfile || appProfile)
      );
    } catch {
      busy.fail("Network error. Please try again.");
    }
  }

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

      <div className="ceo-login__card">
        <div className="ceo-login__card-head">
          <p className="ceo-login__card-label">Property</p>
          <p className="ceo-login__card-value">
            {propertyName || "Your property"}
          </p>
        </div>
        <button
          type="button"
          className="ceo-login__change"
          onClick={onChangeProperty}
          disabled={changingProperty}
        >
          {changingProperty ? "Changing property…" : "Change property"}
        </button>
        <form onSubmit={onSubmit} className="ceo-login__form">
          <AuthField
            icon={<UserIcon className="ceo-field__icon" />}
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoCapitalize="none"
            aria-label="Username or email"
            placeholder="Username or email"
          />
          <AuthField
            icon={<LockIcon className="ceo-field__icon" />}
            secret
            revealed={showPassword}
            onRevealChange={setShowPassword}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            aria-label="Password"
            placeholder="Password"
          />
          {busy.error ? <p className="ceo-login__error">{busy.error}</p> : null}
          <Button
            type="submit"
            className="w-full"
            disabled={busy.loading || !baseUrl || changingProperty}
          >
            {busy.loading ? "Signing in…" : "Sign in"}
          </Button>
          <div className="ceo-login__links">
            <a
              className="ceo-login__link"
              href={baseUrl ? `${baseUrl}/wp-login.php?action=lostpassword` : "#"}
              target="_blank"
              rel="noreferrer"
            >
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
