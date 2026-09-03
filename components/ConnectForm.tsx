"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { normalizeBaseUrl, saveConnectConfig } from "@/lib/connect";

export function ConnectForm() {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState("");
  const [securityKey, setSecurityKey] = useState("");
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
        return;
      }
      saveConnectConfig(
        normalized,
        data.clientName || "",
        data.clientLogo || ""
      );
      router.push("/login");
      router.refresh();
    } catch {
      setError("Network error. Check the property URL and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Property URL"
        name="baseUrl"
        placeholder="http://ceonesource.local/starlink"
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
        required
        autoComplete="url"
      />
      <Input
        label="Security Key"
        name="securityKey"
        placeholder="Mobile app security key"
        value={securityKey}
        onChange={(e) => setSecurityKey(e.target.value)}
        required
        autoComplete="off"
      />
      {error ? (
        <p className="rounded-xl bg-[#3a1c1c] px-3 py-2 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Connecting…" : "Connect"}
      </Button>
    </form>
  );
}
