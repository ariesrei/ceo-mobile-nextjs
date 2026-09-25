"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useBusyState } from "@/hooks/useBusyState";
import { useConnectSession } from "@/hooks/useConnectSession";
import type { AppProfile } from "@/lib/app-profile";
import { postLoginPath } from "@/lib/brand";
import {
  clearRememberedLogin,
  readRememberedLogin,
  readRememberedUsername,
  rememberLoginEnabled,
  saveRememberedLogin,
} from "@/lib/helpers/remember-login";
import {
  clearBrowserTokens,
  loginFromProperty,
  saveBrowserTokens,
  writeStoredNavRole,
} from "@/lib/browser-wp";
import { navRoleFromUser } from "@/lib/navigation";
import { clearConnectConfig } from "@/lib/connect";
import { publicWpErrorMessage } from "@/lib/wp-error";
import { AuthScreen } from "./auth/AuthScreen";
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
  const { config, remember } = useConnectSession();
  const busy = useBusyState();
  const [username, setUsername] = useState(readRememberedUsername);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(rememberLoginEnabled);
  const [showPassword, setShowPassword] = useState(false);
  const [changingProperty, setChangingProperty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readRememberedLogin().then((saved) => {
      if (cancelled || !saved.enabled) return;
      setRememberMe(true);
      if (saved.username) setUsername(saved.username);
      if (saved.password) setPassword(saved.password);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const baseUrl = config?.baseUrl || fallbackBaseUrl || "";
  const propertyName = fallbackName || config?.clientName || "";

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
      if (rememberMe) {
        await saveRememberedLogin(username, password);
      } else {
        clearRememberedLogin();
      }
      if (verified.ok) {
        saveBrowserTokens(
          verified.data.access_token,
          verified.data.refresh_token
        );
      }
      const user = data.user || (verified.ok ? verified.data.user : null);
      const navRole = navRoleFromUser(user);
      if (navRole !== "unknown") {
        writeStoredNavRole(navRole, user?.id);
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
    <AuthScreen
      fallbackLogo={fallbackLogo}
      fallbackName={fallbackName}
      fallbackHero={fallbackHero}
      fallbackTagline={fallbackTagline}
      fallbackBaseUrl={fallbackBaseUrl}
      appProfile={appProfile}
    >
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
        <label className="ceo-login__remember">
          <input
            type="checkbox"
            name="remember"
            checked={rememberMe}
            onChange={(e) => {
              const next = e.target.checked;
              setRememberMe(next);
              if (!next) clearRememberedLogin();
            }}
          />
          Remember me
        </label>
        {busy.error ? <p className="ceo-login__error">{busy.error}</p> : null}
        <Button
          type="submit"
          className="w-full"
          disabled={busy.loading || !baseUrl || changingProperty}
        >
          {busy.loading ? "Signing in…" : "Sign in"}
        </Button>
        <div className="ceo-login__links">
          <Link className="ceo-login__link" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthScreen>
  );
}
