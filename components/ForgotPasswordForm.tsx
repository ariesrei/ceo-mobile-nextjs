"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useBusyState } from "@/hooks/useBusyState";
import { useConnectSession } from "@/hooks/useConnectSession";
import type { AppProfile } from "@/lib/app-profile";
import { publicWpErrorMessage } from "@/lib/wp-error";
import { AuthScreen } from "./auth/AuthScreen";
import { AuthField } from "./auth/AuthField";
import { Button } from "./ui/Button";
import { UserIcon } from "./ui/Icons";

type Props = {
  fallbackLogo?: string;
  fallbackName?: string;
  fallbackHero?: string;
  fallbackTagline?: string;
  fallbackBaseUrl?: string;
  appProfile?: AppProfile | null;
};

export function ForgotPasswordForm(props: Props) {
  const { config } = useConnectSession();
  const busy = useBusyState();
  const [username, setUsername] = useState("");
  const [sent, setSent] = useState("");
  const baseUrl = config?.baseUrl || props.fallbackBaseUrl || "";
  const propertyName = props.fallbackName || config?.clientName || "";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSent("");
    busy.start();
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, baseUrl }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        busy.fail(
          publicWpErrorMessage(data.message, "Could not send reset email.")
        );
        return;
      }
      busy.setLoading(false);
      setSent(
        data.message ||
          "If an account exists for that username or email, you will receive a password reset link shortly."
      );
    } catch {
      busy.fail("Network error. Please try again.");
    }
  }

  return (
    <AuthScreen {...props}>
      <div className="ceo-login__card-head">
        <p className="ceo-login__card-label">Reset password</p>
        <p className="ceo-login__card-value">
          {propertyName || "Your property"}
        </p>
      </div>
      <p className="ceo-login__intro">
        Enter your username or email address and we will send you a link to
        reset your password.
      </p>
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
        {busy.error ? <p className="ceo-login__error">{busy.error}</p> : null}
        {sent ? <p className="ceo-login__success">{sent}</p> : null}
        <Button
          type="submit"
          className="w-full"
          disabled={busy.loading || !baseUrl}
        >
          {busy.loading ? "Sending…" : "Get new password"}
        </Button>
        <div className="ceo-login__links">
          <Link className="ceo-login__link" href="/login">
            Back to login
          </Link>
        </div>
      </form>
    </AuthScreen>
  );
}
