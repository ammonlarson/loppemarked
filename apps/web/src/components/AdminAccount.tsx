"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate } from "@/utils/formatDate";
import { colors, fonts } from "@/styles/theme";

interface Admin {
  id: string;
  email: string;
  created_at: string;
}

export function AdminAccount() {
  const { t, language } = useLanguage();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [creating, setCreating] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/admin/admins", { credentials: "include" });
      if (res.ok) {
        const data: Admin[] = await res.json();
        setAdmins(data);
      } else {
        setMessage({ type: "error", text: t("common.error") });
      }
    } catch {
      setMessage({ type: "error", text: t("common.error") });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (createPassword.length < 8) {
      setMessage({ type: "error", text: t("admin.account.passwordMinLength") });
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: createEmail, password: createPassword }),
      });

      if (!res.ok) {
        const body = await res.json();
        setMessage({ type: "error", text: body.error ?? t("common.error") });
        return;
      }

      setMessage({ type: "success", text: t("admin.account.createSuccess") });
      setCreateEmail("");
      setCreatePassword("");
      await fetchAdmins();
    } catch {
      setMessage({ type: "error", text: t("common.error") });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(admin: Admin) {
    if (!window.confirm(t("admin.account.confirmDelete"))) return;

    setMessage(null);

    try {
      const res = await fetch(`/admin/admins/${admin.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json();
        const text = body.code === "SELF_DELETE"
          ? t("admin.account.selfDeleteError")
          : (body.error ?? t("common.error"));
        setMessage({ type: "error", text });
        return;
      }

      setMessage({ type: "success", text: t("admin.account.deleted") });
      await fetchAdmins();
    } catch {
      setMessage({ type: "error", text: t("common.error") });
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: t("admin.account.passwordMinLength") });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const body = await res.json();
        setMessage({ type: "error", text: body.error ?? t("common.error") });
        return;
      }

      setMessage({ type: "success", text: t("admin.account.passwordChanged") });
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setMessage({ type: "error", text: t("common.error") });
    } finally {
      setChangingPassword(false);
    }
  }

  const inputStyle = {
    padding: "0.5rem",
    border: `1px solid ${colors.borderTan}`,
    borderRadius: 4,
    fontSize: "1rem",
    fontFamily: fonts.body,
  };

  const buttonStyle = {
    padding: "0.5rem 1rem",
    background: colors.sage,
    color: colors.white,
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "1rem",
    fontFamily: fonts.body,
    alignSelf: "flex-start" as const,
  };

  return (
    <section style={{ maxWidth: 700, margin: "0 auto", padding: "0 1rem" }}>
      <h2 style={{ fontFamily: fonts.heading, color: colors.warmBrown }}>{t("admin.account.title")}</h2>

      {message && (
        <p
          role="alert"
          style={{
            color: message.type === "error" ? colors.dustyRose : colors.sageDark,
            margin: "0 0 1rem",
            fontSize: "0.85rem",
          }}
        >
          {message.text}
        </p>
      )}

      <h3 style={{ fontFamily: fonts.heading, color: colors.warmBrown }}>{t("admin.account.admins")}</h3>
      {loading ? (
        <p style={{ color: colors.warmBrown, fontSize: "0.9rem" }}>{t("common.loading")}</p>
      ) : admins.length === 0 ? (
        <p style={{ color: colors.warmBrown, fontSize: "0.9rem" }}>{t("admin.account.noAdmins")}</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.borderTan}`, textAlign: "left" }}>
              <th style={{ padding: "0.5rem", color: colors.warmBrown, fontFamily: fonts.body }}>{t("admin.account.email")}</th>
              <th style={{ padding: "0.5rem", color: colors.warmBrown, fontFamily: fonts.body }}>{t("admin.account.created")}</th>
              <th style={{ padding: "0.5rem", color: colors.warmBrown, fontFamily: fonts.body }}>{t("admin.account.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} style={{ borderBottom: `1px solid ${colors.parchment}` }}>
                <td style={{ padding: "0.5rem" }}>{admin.email}</td>
                <td style={{ padding: "0.5rem" }}>{formatDate(admin.created_at, language)}</td>
                <td style={{ padding: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => handleDelete(admin)}
                    style={{
                      background: "none",
                      border: `1px solid ${colors.dustyRose}`,
                      color: colors.dustyRose,
                      borderRadius: 4,
                      padding: "0.25rem 0.5rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontFamily: fonts.body,
                    }}
                  >
                    {t("admin.account.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ fontFamily: fonts.heading, color: colors.warmBrown }}>{t("admin.account.createTitle")}</h3>
      <form
        onSubmit={handleCreate}
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: fonts.body, color: colors.warmBrown }}>
            {t("admin.account.createEmail")}
          </span>
          <input
            type="email"
            required
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            autoComplete="off"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: fonts.body, color: colors.warmBrown }}>
            {t("admin.account.createPassword")}
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            autoComplete="new-password"
            style={inputStyle}
          />
        </label>
        <button type="submit" disabled={creating} style={buttonStyle}>
          {creating ? t("common.loading") : t("admin.account.createButton")}
        </button>
      </form>

      <h3 style={{ fontFamily: fonts.heading, color: colors.warmBrown }}>{t("admin.account.changePasswordTitle")}</h3>
      <form
        onSubmit={handleChangePassword}
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: fonts.body, color: colors.warmBrown }}>
            {t("admin.account.currentPassword")}
          </span>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: fonts.body, color: colors.warmBrown }}>
            {t("admin.account.newPassword")}
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            style={inputStyle}
          />
        </label>
        <button type="submit" disabled={changingPassword} style={buttonStyle}>
          {changingPassword ? t("common.loading") : t("admin.account.changePasswordButton")}
        </button>
      </form>
    </section>
  );
}
