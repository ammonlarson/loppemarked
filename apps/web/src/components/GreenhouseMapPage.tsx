"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  GREENHOUSES,
  type Greenhouse,
  type GreenhouseSummary,
  type PlanterBoxPublic,
} from "@greenspace/shared";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useHistoryState } from "@/hooks/useHistoryState";
import { LoadingSplash } from "./LoadingSplash";
import { GreenhouseMap } from "./GreenhouseMap";
import { BoxStateLegend } from "./BoxStateLegend";
import { RegistrationForm } from "./RegistrationForm";
import { WaitlistForm } from "./WaitlistForm";
import { colors, fonts, containerStyle, headingStyle, alertWarning } from "@/styles/theme";

interface GreenhouseMapPageProps {
  greenhouse: Greenhouse;
  onBack: () => void;
  onSelectGreenhouse?: (greenhouse: Greenhouse) => void;
}

type PageView = "map" | "register" | "waitlist";

export function GreenhouseMapPage({ greenhouse, onBack, onSelectGreenhouse }: GreenhouseMapPageProps) {
  const { t } = useLanguage();
  const [boxes, setBoxes] = useState<PlanterBoxPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageView, setPageView] = useHistoryState<PageView>("greenhouse.pageView", "map");
  const [selectedBoxId, setSelectedBoxId] = useHistoryState<number | null>("greenhouse.boxId", null);
  const [otherGreenhouse, setOtherGreenhouse] = useState<GreenhouseSummary | null>(null);

  const fetchBoxes = useCallback(async () => {
    try {
      const res = await fetch("/public/boxes");
      if (res.ok) {
        const all: PlanterBoxPublic[] = await res.json();
        setBoxes(
          all
            .filter((b) => b.greenhouse === greenhouse)
            .sort((a, b) => {
              const aAvail = a.state === "available" ? 0 : 1;
              const bAvail = b.state === "available" ? 0 : 1;
              if (aAvail !== bAvail) return aAvail - bAvail;
              return a.name.localeCompare(b.name);
            }),
        );
      }
    } catch {
      /* API unreachable — map will show empty */
    } finally {
      setLoading(false);
    }
  }, [greenhouse]);

  useEffect(() => {
    async function fetchGreenhouseSummaries() {
      try {
        const res = await fetch("/public/greenhouses");
        if (res.ok) {
          const summaries: GreenhouseSummary[] = await res.json();
          const otherName = GREENHOUSES.find((g) => g !== greenhouse);
          const other = summaries.find((s) => s.name === otherName) ?? null;
          setOtherGreenhouse(other);
        }
      } catch {
        /* API unreachable — cross-link will not show */
      }
    }
    fetchGreenhouseSummaries();
  }, [greenhouse]);

  useEffect(() => {
    fetchBoxes();
  }, [fetchBoxes]);

  const total = boxes.length;
  const available = boxes.filter((b) => b.state === "available").length;
  const occupied = boxes.filter((b) => b.state === "occupied").length;
  const hasAvailable = available > 0;
  const otherHasAvailable = otherGreenhouse !== null && otherGreenhouse.availableBoxes > 0;

  if (loading) {
    return <LoadingSplash />;
  }

  if (pageView === "register" && selectedBoxId !== null) {
    return (
      <RegistrationForm
        boxId={selectedBoxId}
        onCancel={() => setPageView("map")}
        onBoxUnavailable={() => setPageView("waitlist")}
        onSuccess={() => {
          fetchBoxes();
          setPageView("map");
        }}
      />
    );
  }

  if (pageView === "waitlist") {
    return (
      <WaitlistForm
        onCancel={() => setPageView("map")}
      />
    );
  }

  return (
    <section style={{ ...containerStyle, maxWidth: 800 }}>
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
          marginBottom: "1rem",
          fontFamily: fonts.body,
        }}
      >
        &larr; {t("map.back")}
      </button>

      <div style={{ textAlign: "center", marginBottom: ".25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <Image
            src={greenhouse.includes("Kronen") ? "/leaf.png" : "/bird.png"}
            alt=""
            width={48}
            height={48}
            style={{ objectFit: "contain" }}
          />
          <h2 style={{ ...headingStyle, margin: 0 }}>{greenhouse}</h2>
        </div>

        <div style={{ marginBottom: "0.25rem" }}>
          <Image
            src={greenhouse.includes("Kronen") ? "/plant_separator.png" : "/bird_separator.png"}
            alt=""
            width={400}
            height={80}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
            fontSize: "0.9rem",
            color: colors.warmBrown,
            fontFamily: fonts.body,
            marginBottom: "0.75rem",
          }}
        >
          <span>
            {t("greenhouse.totalBoxes")}: <strong>{total}</strong>
          </span>
          <span>
            {t("greenhouse.available")}:{" "}
            <strong style={{ color: colors.sageDark }}>{available}</strong>
          </span>
          <span>
            {t("greenhouse.occupied")}: <strong>{occupied}</strong>
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <BoxStateLegend />
        </div>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <GreenhouseMap
          boxes={boxes}
          onSelectBox={(id) => {
            setSelectedBoxId(id);
            setPageView("register");
          }}
        />
      </div>

      {!hasAvailable && (
        <div style={{ marginTop: "1.5rem" }}>
          <section
            style={{
              ...alertWarning,
              padding: "1.25rem",
            }}
          >
            {otherHasAvailable && onSelectGreenhouse && otherGreenhouse && (
              <div
                style={{
                  marginBottom: "1rem",
                  paddingBottom: "0.75rem",
                  borderBottom: `1px solid ${colors.borderTan}`,
                }}
              >
                <p style={{ margin: "0 0 0.5rem", color: colors.warmBrown, fontSize: "0.95rem", fontFamily: fonts.body }}>
                  {t("waitlist.otherAvailable").replace("{greenhouse}", otherGreenhouse.name)}
                </p>
                <button
                  type="button"
                  onClick={() => onSelectGreenhouse(otherGreenhouse.name)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: colors.sage,
                    color: colors.white,
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: fonts.body,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  {t("waitlist.goToOther").replace("{greenhouse}", otherGreenhouse.name)}
                </button>
              </div>
            )}
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontFamily: fonts.heading, color: colors.warmBrown }}>
              {t("waitlist.title")}
            </h3>
            <p style={{ margin: "0 0 0.75rem", color: colors.warmBrown, fontSize: "0.95rem", fontFamily: fonts.body }}>
              {t("waitlist.description")}
            </p>
            <button
              type="button"
              onClick={() => setPageView("waitlist")}
              style={{
                padding: "0.5rem 1rem",
                background: colors.mutedGold,
                color: colors.white,
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: fonts.body,
                fontSize: "0.95rem",
                fontWeight: 600,
              }}
            >
              {t("waitlist.joinButton")}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
