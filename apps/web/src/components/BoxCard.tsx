"use client";

import Image from "next/image";
import type { PublicBoxState } from "@loppemarked/shared";
import { useLanguage } from "@/i18n/LanguageProvider";
import { BOX_STATE_COLORS } from "./boxStateColors";
import { colors as themeColors, fonts } from "@/styles/theme";

function boxImagePath(name: string): string {
  return `/${name.toLowerCase().replace(/ /g, "_")}.png`;
}

interface BoxCardProps {
  name: string;
  state: PublicBoxState;
  onClick?: () => void;
}

export function BoxCard({ name, state, onClick }: BoxCardProps) {
  const { t } = useLanguage();
  const colors = BOX_STATE_COLORS[state];
  const isClickable = state === "available" && onClick;

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      aria-label={`${name} – ${t(`map.state.${state}`)}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: `2px solid ${colors.border}`,
        borderRadius: 8,
        background: "#fdfdfd",
        cursor: isClickable ? "pointer" : "default",
        minWidth: 100,
        textAlign: "center",
        fontFamily: fonts.body,
        fontSize: "inherit",
        overflow: "hidden",
        transition: "box-shadow 0.15s",
        padding: 0,
      }}
    >
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: colors.text,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          background: colors.background,
          width: "100%",
          padding: "0.35rem 0.5rem",
        }}
      >
        {t(`map.state.${state}`)}
      </span>
      <Image
        src={boxImagePath(name)}
        alt=""
        width={48}
        height={48}
        style={{ objectFit: "contain", margin: "0.5rem 0 0.25rem" }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span
        style={{
          fontSize: "0.85rem",
          color: themeColors.warmBrown,
          paddingBottom: "0.5rem",
        }}
      >
        {name}
      </span>
    </button>
  );
}
