"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_OPENING_DATETIME, type Greenhouse, type GreenhouseSummary } from "@greenspace/shared";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useHistoryState } from "@/hooks/useHistoryState";
import { LanguageSelector } from "@/components/LanguageSelector";
import { PreOpenPage } from "@/components/PreOpenPage";
import { LandingPage } from "@/components/LandingPage";
import { GreenhouseMapPage } from "@/components/GreenhouseMapPage";
import { WaitlistForm } from "@/components/WaitlistForm";
import { AdminPage } from "@/components/AdminPage";
import { LoadingSplash } from "@/components/LoadingSplash";
import { ProjectAbout } from "@/components/ProjectAbout";
import { colors, fonts } from "@/styles/theme";

type View = "public" | "admin";

/** Polling interval when in pre-open state (30 seconds). */
const PRE_OPEN_POLL_MS = 30_000;

interface PublicStatus {
  isOpen: boolean;
  openingDatetime: string | null;
  hasAvailableBoxes: boolean;
  serverTime?: string;
}

export default function Home() {
  const { t, ready } = useLanguage();
  const [view, setView] = useHistoryState<View>("home.view", "public");
  const [selectedGreenhouse, setSelectedGreenhouse] = useHistoryState<Greenhouse | null>("home.greenhouse", null);
  const [showWaitlistForm, setShowWaitlistForm] = useHistoryState<boolean>("home.waitlistForm", false);
  const [status, setStatus] = useState<PublicStatus | null>(null);
  const [statusResolved, setStatusResolved] = useState(false);
  const [greenhouses, setGreenhouses] = useState<GreenhouseSummary[]>([]);
  const [greenhousesLoaded, setGreenhousesLoaded] = useState(false);
  const [landingRefreshKey, setLandingRefreshKey] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/public/status");
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch {
      /* API unreachable — safe default is pre-open (deny early access) */
    } finally {
      setStatusResolved(true);
    }
  }, []);

  const fetchGreenhouses = useCallback(async () => {
    try {
      const res = await fetch("/public/greenhouses");
      if (res.ok) {
        setGreenhouses(await res.json());
      }
    } catch {
      /* API unreachable — cards will show fallback data */
    } finally {
      setGreenhousesLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchGreenhouses();
  }, [fetchStatus, fetchGreenhouses]);

  // Server-authoritative gate: trust the server's isOpen flag.
  // When API is unreachable (status === null), default to pre-open (safe/deny).
  const preOpen = status ? !status.isOpen : true;
  const openingDatetime = status?.openingDatetime ?? DEFAULT_OPENING_DATETIME;

  // Re-fetch greenhouses when returning from a greenhouse map view.
  useEffect(() => {
    if (landingRefreshKey > 0) {
      fetchGreenhouses();
    }
  }, [landingRefreshKey, fetchGreenhouses]);

  // Poll /public/status while in pre-open so the page auto-transitions
  // at the correct server-determined time without requiring a manual refresh.
  useEffect(() => {
    if (preOpen) {
      pollRef.current = setInterval(fetchStatus, PRE_OPEN_POLL_MS);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [preOpen, fetchStatus]);

  function renderContent() {
    if (view === "admin") {
      return (
        <AdminPage
          onBack={() => setView("public")}
        />
      );
    }
    if (preOpen) {
      return <PreOpenPage openingDatetime={openingDatetime} />;
    }
    if (selectedGreenhouse) {
      return (
        <GreenhouseMapPage
          greenhouse={selectedGreenhouse}
          onBack={() => {
            setSelectedGreenhouse(null);
            fetchStatus();
            setLandingRefreshKey((k) => k + 1);
          }}
          onSelectGreenhouse={setSelectedGreenhouse}
        />
      );
    }
    if (showWaitlistForm) {
      return (
        <WaitlistForm
          onCancel={() => setShowWaitlistForm(false)}
        />
      );
    }
    return (
      <LandingPage
        greenhouses={greenhouses}
        onSelectGreenhouse={setSelectedGreenhouse}
        hasAvailableBoxes={status?.hasAvailableBoxes ?? true}
        onJoinWaitlist={() => setShowWaitlistForm(true)}
      />
    );
  }

  if (!ready || !statusResolved || !greenhousesLoaded) {
    return <LoadingSplash />;
  }

  return (
    <main style={{ fontFamily: fonts.body, color: colors.inkBrown, background: colors.backgroundLight, minHeight: "100vh" }}>
      <header
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "1rem 1.5rem",
          borderBottom: `1px solid ${colors.borderTan}`,
        }}
      >
        <div />
        <button
          type="button"
          onClick={() => {
            setView("public");
            setSelectedGreenhouse(null);
            setShowWaitlistForm(false);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            margin: 0,
            fontSize: "1.25rem",
            fontFamily: fonts.heading,
            color: colors.inkBrown,
          }}
        >
          <h1 style={{ fontSize: "inherit", margin: 0, fontFamily: "inherit", color: "inherit", fontWeight: 700 }}>
            {t("common.appName")}
          </h1>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
          {view === "public" && (
            <button
              type="button"
              onClick={() => setView("admin")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: colors.warmBrown,
                opacity: 0.4,
                fontFamily: fonts.body,
              }}
            >
              {t("admin.link")}
            </button>
          )}
          <LanguageSelector />
        </div>
      </header>

      {renderContent()}
      {view === "public" && <ProjectAbout />}
    </main>
  );
}
