"use client";

import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { colors, fonts, headingStyle, inputStyle as themeInputStyle } from "@/styles/theme";

interface AdminLoginProps {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? t("admin.loginFailed"));
        return;
      }

      onLogin();
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 400, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 style={headingStyle}>{t("admin.login")}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: fonts.body, color: colors.warmBrown }}>{t("admin.email")}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={{ ...themeInputStyle, fontSize: "1rem" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: fonts.body, color: colors.warmBrown }}>{t("admin.password")}</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ ...themeInputStyle, fontSize: "1rem" }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span style={{ fontSize: "0.85rem", fontFamily: fonts.body, color: colors.warmBrown }}>{t("admin.rememberMe")}</span>
        </label>
        {error && (
          <p role="alert" style={{ color: colors.dustyRose, margin: 0, fontSize: "0.85rem" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            background: colors.sage,
            color: colors.white,
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontFamily: fonts.body,
          }}
        >
          {loading ? t("common.loading") : t("admin.login")}
        </button>
      </form>
    </section>
  );
}
