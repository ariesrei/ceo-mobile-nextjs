"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { getConnectConfig, saveConnectConfig } from "@/lib/connect";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cfg = getConnectConfig();
    if (!cfg?.baseUrl) {
      router.replace("/connect");
      return;
    }
    setBaseUrl(cfg.baseUrl);
  }, [router]);

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
        setError(data.message || "Login failed.");
        return;
      }
      if (data.user?.client_name && baseUrl) {
        saveConnectConfig(
          baseUrl,
          data.user.client_name,
          data.user.client_logo || ""
        );
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {baseUrl ? (
        <p className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--muted)]">
          Connected to <span className="font-medium text-[var(--ink)]">{baseUrl}</span>
        </p>
      ) : null}
      <Input
        label="Username or email"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="username"
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading || !baseUrl}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <button
        type="button"
        className="w-full text-sm text-[var(--muted)] underline-offset-2 hover:underline"
        onClick={() => router.push("/connect")}
      >
        Change property
      </button>
    </form>
  );
}
