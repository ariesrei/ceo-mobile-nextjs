"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "./ui/Icons";
import { appBrand } from "@/lib/brand";
import { getConnectConfig, saveConnectConfig } from "@/lib/connect";
import { publicWpErrorMessage } from "@/lib/wp-error";

type Props = {
  /** Property branding resolved on the server from the connect cookies. */
  fallbackLogo?: string;
  fallbackName?: string;
  fallbackHero?: string;
  fallbackTagline?: string;
};

export function LoginForm({
  fallbackLogo = "",
  fallbackName = "",
  fallbackHero = "",
  fallbackTagline = "",
}: Props) {
  const router = useRouter();
  const brand = appBrand();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [propertyName, setPropertyName] = useState(fallbackName);
  const [propertyLogo, setPropertyLogo] = useState(fallbackLogo);
  const [hero, setHero] = useState(fallbackHero);
  const [tagline, setTagline] = useState(fallbackTagline);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cfg = getConnectConfig();
    if (!cfg?.baseUrl) {
      router.replace("/connect");
      return;
    }
    setBaseUrl(cfg.baseUrl);
    if (cfg.clientName) setPropertyName(cfg.clientName);
    if (cfg.clientLogo) setPropertyLogo(cfg.clientLogo);
    const nextHero = cfg.clientHero || fallbackHero;
    if (nextHero) setHero(nextHero);
    const nextTagline = cfg.clientTagline || fallbackTagline;
    if (nextTagline) setTagline(nextTagline);
    if (!cfg.clientHero && fallbackHero) {
      saveConnectConfig(
        cfg.baseUrl,
        cfg.clientName,
        cfg.clientLogo,
        fallbackHero,
        nextTagline
      );
    }
  }, [router, fallbackHero, fallbackTagline]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, baseUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(publicWpErrorMessage(data.message, "Login failed."));
        setLoading(false);
        return;
      }
      if (data.user?.client_name && baseUrl) {
        saveConnectConfig(
          baseUrl,
          data.user.client_name,
          data.user.client_logo || "",
          data.user.client_hero || "",
          data.user.client_tagline || ""
        );
      }
      /*
       * Stays in the loading state on purpose. The push below is not awaited
       * and the next screen can take seconds to arrive, so clearing it here
       * puts an idle-looking "Sign in" button back under the user's finger
       * while the sign-in is still finishing, inviting a second press.
       */
      router.push("/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="ceo-login">
      {/* Background comes from the property's WordPress Resident Portal image,
          full-bleed behind everything. The veil that keeps the text readable
          lives in CSS, so a property with no image falls back to flat navy. */}
      {hero ? (
        <div
          className="ceo-login__hero"
          style={{ backgroundImage: `url(${hero})` }}
          aria-hidden
        />
      ) : null}

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

      {/* Everything here comes from the property's own WordPress site: the
          logo is the custom logo, the name is the site title and the line
          under it is the site tagline. Each is skipped when unset. */}
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
        {/* Static, not a picker: a user must never be able to browse other
            properties, so the device stores only the one it connected to. */}
        <div className="ceo-login__card-head">
          <p className="ceo-login__card-label">Property</p>
          <p className="ceo-login__card-value">
            {propertyName || "Your property"}
          </p>
        </div>

        {/* Returns to the connect form, which asks for the URL and secret key
            again. It never lists properties, so it cannot be used to discover
            one the user was not given credentials for. */}
        <button
          type="button"
          className="ceo-login__change"
          onClick={() => router.push("/connect")}
        >
          Change property
        </button>

        <form onSubmit={onSubmit} className="ceo-login__form">
          <div className="ceo-field">
            <UserIcon className="ceo-field__icon" />
            <input
              className="ceo-field__input"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoCapitalize="none"
              aria-label="Username or email"
              placeholder="Username or email"
            />
          </div>

          <div className="ceo-field">
            <LockIcon className="ceo-field__icon" />
            <input
              className="ceo-field__input ceo-field__input--password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              aria-label="Password"
              placeholder="Password"
            />
            <button
              type="button"
              className="ceo-field__eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOffIcon className="ceo-field__eye-svg" />
              ) : (
                <EyeIcon className="ceo-field__eye-svg" />
              )}
            </button>
          </div>

          {error ? <p className="ceo-login__error">{error}</p> : null}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !baseUrl}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <div className="ceo-login__links">
            <a
              className="ceo-login__link"
              href={
                baseUrl ? `${baseUrl}/wp-login.php?action=lostpassword` : "#"
              }
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
