"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { EyeIcon, EyeOffIcon, GlobeIcon, LockIcon } from "./ui/Icons";
import { normalizeBaseUrl, saveConnectConfig } from "@/lib/connect";

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
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: normalized, securityKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.message || "Could not connect to this property.");
        setLoading(false);
        return;
      }
      saveConnectConfig(
        normalized,
        data.clientName || "",
        data.clientLogo || "",
        data.clientHero || "",
        data.clientTagline || ""
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
          name="securityKey"
          type={showKey ? "text" : "password"}
          autoCapitalize="none"
          aria-label="Secret key"
          placeholder="Secret key"
          value={securityKey}
          onChange={(e) => setSecurityKey(e.target.value)}
          required
          autoComplete="off"
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
