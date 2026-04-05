"use client";

import Image from "next/image";
import type { Greenhouse } from "@greenspace/shared";
import { useLanguage } from "@/i18n/LanguageProvider";
import { colors, fonts, shadows } from "@/styles/theme";

interface GreenhouseCardProps {
  name: Greenhouse;
  totalBoxes: number;
  availableBoxes: number;
  occupiedBoxes: number;
  onSelect?: () => void;
}

function GreenhouseIcon({ isKronen }: { isKronen: boolean }) {
  return (
    <Image
      src={isKronen ? "/leaf.png" : "/bird.png"}
      alt=""
      width={40}
      height={40}
      style={{ objectFit: "contain" }}
    />
  );
}

export function GreenhouseCard({
  name,
  totalBoxes,
  availableBoxes,
  occupiedBoxes,
  onSelect,
}: GreenhouseCardProps) {
  const { t } = useLanguage();

  const isKronen = name.includes("Kronen");
  const imageSrc = isKronen ? "/kronen.png" : "/soen.png";

  return (
    <article
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `${name} – ${t("map.viewMap")}` : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      style={{
        position: "relative",
        flex: 1,
        minWidth: 200,
        cursor: onSelect ? "pointer" : "default",
      }}
    >
      {/* Greenhouse image */}
      <div style={{
        width: "100%",
        aspectRatio: "2.2 / 1",
        position: "relative",
        marginBottom: "0.5rem",
      }}>
        <Image
          src={imageSrc}
          alt={name}
          fill
          style={{ objectFit: "contain", objectPosition: isKronen ? "center bottom" : "55% bottom"  }}
          sizes="(max-width: 600px) 45vw, 300px"
          priority
        />
      </div>

      {/* Info card overlay */}
      <div style={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        background: colors.overlayWhite,
        borderRadius: 10,
        padding: "1.25rem 1rem 2rem",
        boxShadow: shadows.overlay,
        border: `1px solid ${colors.overlayBorder}`,
        textAlign: "center",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.8rem",
          marginBottom: "1.25rem",
        }}>
          <GreenhouseIcon isKronen={isKronen} />
          <h3 style={{
            margin: 0,
            fontFamily: fonts.heading,
            fontSize: "1.05rem",
            color: colors.inkBrown,
            fontWeight: 600,
          }}>{name}</h3>
        </div>

        <div style={{
          fontFamily: fonts.body,
          fontSize: "0.85rem",
          color: colors.sage,
          lineHeight: 1.6,
        }}>
          <span><strong style={{ color: colors.inkBrown }}>{totalBoxes}</strong> {t("greenhouse.totalBoxes")}</span>
          <span style={{ margin: "0 0.15rem", color: colors.borderTan }}> · </span>
          <span><strong style={{ color: colors.sageDark }}>{availableBoxes}</strong> {t("greenhouse.available")}</span>
          <span style={{ margin: "0 0.15rem", color: colors.borderTan }}> · </span>
          <span><strong style={{ color: colors.inkBrown }}>{occupiedBoxes}</strong> {t("greenhouse.occupied")}</span>
        </div>

      </div>
    </article>
  );
}
