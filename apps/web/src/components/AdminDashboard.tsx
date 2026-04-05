"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageProvider";
import { colors, fonts } from "@/styles/theme";
import { AdminRegistrations } from "./AdminRegistrations";
import { AdminWaitlist } from "./AdminWaitlist";
import { AdminBoxes } from "./AdminBoxes";
import { AdminSettings } from "./AdminSettings";
import { AdminAuditLog } from "./AdminAuditLog";
import { AdminAccount } from "./AdminAccount";
import { AdminMessaging } from "./AdminMessaging";
import { AdminStagingTools } from "./AdminStagingTools";

const isStaging = process.env.NEXT_PUBLIC_ENV === "staging";

type Tab = "registrations" | "waitlist" | "boxes" | "messaging" | "settings" | "audit" | "account" | "stagingTools";

const BASE_TABS: Tab[] = ["boxes", "waitlist", "registrations", "messaging", "settings", "audit", "account"];
const TABS: Tab[] = isStaging ? [...BASE_TABS, "stagingTools"] : BASE_TABS;

const TAB_KEYS: Record<Tab, "admin.tab.registrations" | "admin.tab.waitlist" | "admin.tab.boxes" | "admin.tab.messaging" | "admin.tab.settings" | "admin.tab.audit" | "admin.tab.account" | "admin.tab.stagingTools"> = {
  registrations: "admin.tab.registrations",
  waitlist: "admin.tab.waitlist",
  boxes: "admin.tab.boxes",
  messaging: "admin.tab.messaging",
  settings: "admin.tab.settings",
  audit: "admin.tab.audit",
  account: "admin.tab.account",
  stagingTools: "admin.tab.stagingTools",
};

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("boxes");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (!window.confirm(t("admin.logoutConfirm"))) return;

    setLoggingOut(true);
    try {
      await fetch("/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* proceed with logout even on network error */
    } finally {
      setLoggingOut(false);
      onLogout();
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem", fontFamily: fonts.body }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <nav
          role="tablist"
          style={{
            display: "flex",
            gap: "0.25rem",
            borderBottom: `1px solid ${colors.borderTan}`,
            overflowX: "auto",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.6rem 1.25rem",
                border: "none",
                borderBottom: activeTab === tab ? `6px solid ${colors.sageDark}` : "6px solid transparent",
                background: "none",
                cursor: "pointer",
                fontFamily: fonts.body,
                fontSize: "0.9rem",
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? colors.sageDark : colors.warmBrown,
                whiteSpace: "nowrap",
                marginBottom: "-3px",
                paddingBottom: "0.75rem",
              }}
            >
              {t(TAB_KEYS[tab])}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            padding: "0.5rem 1rem",
            background: "none",
            border: `1px solid ${colors.dustyRose}`,
            color: colors.dustyRose,
            borderRadius: 4,
            cursor: loggingOut ? "not-allowed" : "pointer",
            fontSize: "0.85rem",
            fontFamily: fonts.body,
            whiteSpace: "nowrap",
            marginLeft: "1rem",
          }}
        >
          {loggingOut ? t("common.loading") : t("admin.logout")}
        </button>
      </div>

      <div style={{ textAlign: "center", margin: "0.25rem 0 0" }}>
        <Image
          src="/plant_separator.png"
          alt=""
          width={400}
          height={80}
          style={{ objectFit: "contain" }}
        />
      </div>

      <div role="tabpanel" style={{ margin: "0 auto" }}>
        {activeTab === "registrations" && <AdminRegistrations />}
        {activeTab === "waitlist" && <AdminWaitlist />}
        {activeTab === "boxes" && <AdminBoxes />}
        {activeTab === "messaging" && <AdminMessaging />}
        {activeTab === "settings" && <AdminSettings />}
        {activeTab === "audit" && <AdminAuditLog />}
        {activeTab === "account" && <AdminAccount />}
        {activeTab === "stagingTools" && <AdminStagingTools />}
      </div>
    </div>
  );
}
