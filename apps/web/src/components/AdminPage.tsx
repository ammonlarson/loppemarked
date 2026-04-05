"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { colors, fonts } from "@/styles/theme";
import { AdminLogin } from "./AdminLogin";
import { AdminDashboard } from "./AdminDashboard";

interface AdminPageProps {
  onBack: () => void;
}

type AuthState = "checking" | "authenticated" | "unauthenticated";

export function AdminPage({ onBack }: AdminPageProps) {
  const { t } = useLanguage();
  const [authState, setAuthState] = useState<AuthState>("checking");

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/admin/auth/me", { credentials: "include" });
      setAuthState(res.ok ? "authenticated" : "unauthenticated");
    } catch {
      setAuthState("unauthenticated");
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  function handleLogin() {
    setAuthState("authenticated");
  }

  function handleLogout() {
    setAuthState("unauthenticated");
  }

  return (
    <div>
      <div style={{ padding: "0.5rem 1rem" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.9rem",
            color: colors.warmBrown,
            padding: "0.25rem 0",
            fontFamily: fonts.body,
          }}
        >
          &larr; {t("admin.backToPublic")}
        </button>
      </div>

      {authState === "checking" && (
        <p style={{ textAlign: "center", color: colors.warmBrown, padding: "2rem" }}>
          {t("common.loading")}
        </p>
      )}

      {authState === "authenticated" && (
        <AdminDashboard onLogout={handleLogout} />
      )}

      {authState === "unauthenticated" && (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
}
