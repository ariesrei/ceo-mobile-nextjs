"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useBusyState } from "@/hooks/useBusyState";
import { useConnectSession } from "@/hooks/useConnectSession";
import { normalizeBaseUrl, normalizeSecurityKey } from "@/lib/connect";
import type { ConnectResult } from "@/lib/connect-verify";
import {
  connectVerifyErrorMessage,
  parseConnectVerifyBody,
  verifyConnectUrl,
} from "@/lib/verify-connect";
import { AuthField } from "./auth/AuthField";
import { Button } from "./ui/Button";
import { GlobeIcon, LockIcon } from "./ui/Icons";

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
  const { rememberConnect, afterConnectPath } = useConnectSession();
  const busy = useBusyState();
  const [baseUrl, setBaseUrl] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    busy.start();
    try {
      const normalized = normalizeBaseUrl(baseUrl);
      const key = normalizeSecurityKey(securityKey);
      const verified = await verifyFromProperty(normalized, key);
      // WP already rejected this key. Do not verify again from the Next
      // server — that burns a second rate-limit hit and replaces the hint.
      if (!verified.ok && verified.error) {
        busy.fail(verified.error);
        return;
      }
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
      const data = (await res.json()) as ConnectResult & { message?: string };
      if (!res.ok || !data.valid) {
        busy.fail(
          data.message ||
            verified.error ||
            "Could not connect to this property."
        );
        return;
      }
      rememberConnect(data);
      router.push(afterConnectPath(data));
      router.refresh();
    } catch {
      busy.fail("Network error. Check the property URL and try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="ceo-login__form">
      <AuthField
        icon={<GlobeIcon className="ceo-field__icon" />}
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
      <AuthField
        icon={<LockIcon className="ceo-field__icon" />}
        secret
        revealed={showKey}
        onRevealChange={setShowKey}
        name="securityKey"
        autoCapitalize="none"
        aria-label="Secret key"
        placeholder="Secret key"
        value={securityKey}
        onChange={(e) => setSecurityKey(e.target.value)}
        required
        autoComplete="off"
      />
      {busy.error ? <p className="ceo-login__error">{busy.error}</p> : null}
      <Button type="submit" className="w-full" disabled={busy.loading}>
        {busy.loading ? "Connecting…" : "Continue"}
      </Button>
      <p className="ceo-login__hint">
        Your property manager provides the URL and secret key.
      </p>
    </form>
  );
}
