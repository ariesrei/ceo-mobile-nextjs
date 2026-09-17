"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { EyeIcon, EyeOffIcon, GlobeIcon, LockIcon } from "./ui/Icons";
import {
  normalizeBaseUrl,
  normalizeSecurityKey,
  saveConnectConfig,
} from "@/lib/connect";
import {
  connectVerifyErrorMessage,
  parseConnectVerifyBody,
  verifyConnectUrl,
} from "@/lib/verify-connect";

async function verifyFromProperty(baseUrl: string, securityKey: string) {
  try {
    const res = await fetch(verifyConnectUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ security_key: securityKey }),
    });
    const rawBody = await res.text();
    const data = parseConnectVerifyBody(rawBody);
    if (!res.ok || !data.valid) {
      return {
        ok: false as const,
        error: connectVerifyErrorMessage(res.status, rawBody, data),
      };
    }
    return {
      ok: true as const,
      clientName: data.client_name || "",
      clientLogo: data.client_logo || "",
      clientHero: data.client_hero || "",
      clientTagline: data.client_tagline || "",
      planKey: data.plan_key || "",
      appProfile: data.app_profile || "",
    };
  } catch {
    return { ok: false as const, error: "" };
  }
}

export function ConnectForm() {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalized = normalizeBaseUrl(baseUrl);
      const key = normalizeSecurityKey(securityKey);
      const verified = await verifyFromProperty(normalized, key);
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          verified.ok
            ? {
                baseUrl: normalized,
                browserVerified: true,
                clientName: verified.clientName,
                clientLogo: verified.clientLogo,
                clientHero: verified.clientHero,
                clientTagline: verified.clientTagline,
                planKey: verified.planKey,
                appProfile: verified.appProfile,
              }
            : { baseUrl: normalized, securityKey: key }
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(
          data.message ||
            verified.error ||
            "Could not connect to this property."
        );
        setLoading(false);
        return;
      }
      saveConnectConfig(
        normalized,
        data.clientName || "",
        data.clientLogo || "",
        data.clientHero || "",
        data.clientTagline || "",
        { planKey: data.planKey, appProfile: data.appProfile }
      );
      /* Same reasoning as the login form: keep the button busy until the next
         screen actually arrives, rather than re-enabling it mid-navigation. */
      router.push("/login");
      router.refresh();
    } catch {
      setError("Network error. Check the property URL and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="ceo-login__form">
      <div className="ceo-field">
        <GlobeIcon className="ceo-field__icon" />
        <input
          className="ceo-field__input"
          name="baseUrl"
          inputMode="url"
          autoCapitalize="none"
          aria-label="Property URL"
          placeholder="Property URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          required
          autoComplete="url"
        />
      </div>

      <div className="ceo-field">
        <LockIcon className="ceo-field__icon" />
        <input
          className="ceo-field__input ceo-field__input--password"
          name="ceo_mobile_connect_key"
          type={showKey ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Secret key"
          placeholder="Secret key"
          value={securityKey}
          onChange={(e) => setSecurityKey(e.target.value)}
          required
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
        />
        <button
          type="button"
          className="ceo-field__eye"
          onClick={() => setShowKey((v) => !v)}
          aria-label={showKey ? "Hide secret key" : "Show secret key"}
          aria-pressed={showKey}
        >
          {showKey ? (
            <EyeOffIcon className="ceo-field__eye-svg" />
          ) : (
            <EyeIcon className="ceo-field__eye-svg" />
          )}
        </button>
      </div>

      {error ? <p className="ceo-login__error">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Connecting…" : "Continue"}
      </Button>

      <p className="ceo-login__hint">
        Your property manager provides the URL and secret key.
      </p>
    </form>
  );
}
