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
import { LockIcon } from "./ui/Icons";

type Props = {
  resetKey: string;
  login: string;
  fallbackLogo?: string;
  fallbackName?: string;
  fallbackHero?: string;
  fallbackTagline?: string;
  fallbackBaseUrl?: string;
  appProfile?: AppProfile | null;
};

export function ResetPasswordForm({ resetKey, login, ...props }: Props) {
  const { config } = useConnectSession();
  const busy = useBusyState();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState("");
  const baseUrl = config?.baseUrl || props.fallbackBaseUrl || "";
  const propertyName = props.fallbackName || config?.clientName || "";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      busy.fail("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      busy.fail("Password must be at least 8 characters.");
      return;
    }
    setDone("");
    busy.start();
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: resetKey,
          login,
          password,
          password_confirm: confirm,
          baseUrl,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        busy.fail(publicWpErrorMessage(data.message, "Could not reset password."));
        return;
      }
      busy.setLoading(false);
      setDone(data.message || "Password reset. You can sign in now.");
    } catch {
      busy.fail("Network error. Please try again.");
    }
  }

  return (
    <AuthScreen {...props}>
      <div className="ceo-login__card-head">
        <p className="ceo-login__card-label">New password</p>
        <p className="ceo-login__card-value">
          {propertyName || "Your property"}
        </p>
      </div>
      <p className="ceo-login__intro">
        Choose a new password for your account.
      </p>
      {done ? (
        <div className="ceo-login__form">
          <p className="ceo-login__success">{done}</p>
          <Link className="ceo-login__link" href="/login">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="ceo-login__form">
          <AuthField
            icon={<LockIcon className="ceo-field__icon" />}
            secret
            revealed={showPassword}
            onRevealChange={setShowPassword}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            aria-label="New password"
            placeholder="New password"
          />
          <AuthField
            icon={<LockIcon className="ceo-field__icon" />}
            secret
            revealed={showPassword}
            onRevealChange={setShowPassword}
            name="password_confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            aria-label="Confirm password"
            placeholder="Confirm password"
          />
          {busy.error ? <p className="ceo-login__error">{busy.error}</p> : null}
          <Button
            type="submit"
            className="w-full"
            disabled={busy.loading || !baseUrl}
          >
            {busy.loading ? "Saving…" : "Reset password"}
          </Button>
          <div className="ceo-login__links">
            <Link className="ceo-login__link" href="/login">
              Back to login
            </Link>
          </div>
        </form>
      )}
    </AuthScreen>
  );
}
