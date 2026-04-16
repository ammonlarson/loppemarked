"use client";

import Image from "next/image";
import {
  OPENING_TIMEZONE,
} from "@loppemarked/shared";
import { useLanguage } from "@/i18n/LanguageProvider";
import { colors, fonts } from "@/styles/theme";

function formatOpeningDatetime(iso: string, locale: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: OPENING_TIMEZONE,
  }).format(date);
}

interface PreOpenPageProps {
  openingDatetime: string;
}

export function PreOpenPage({ openingDatetime }: PreOpenPageProps) {
  const { language, t } = useLanguage();
  const locale = language === "da" ? "da-DK" : "en-GB";
  const formattedDate = formatOpeningDatetime(openingDatetime, locale);

  return (
    <section style={{ fontFamily: fonts.body, color: colors.inkBrown }}>
      {/* Landing image */}
      <div style={{
        maxWidth: 740,
        margin: "0 auto",
        padding: "2rem 1.5rem 0",
      }}>
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3.6 / 1",
        }}>
          <Image
            src="/landing.png"
            alt="Kronen and Søen greenhouses"
            fill
            style={{ objectFit: "contain" }}
            sizes="(max-width: 740px) 100vw, 740px"
            priority
          />
        </div>
      </div>

      {/* Content area */}
      <div style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "2rem 1.5rem",
        textAlign: "center",
      }}>
        <h2 style={{
          fontFamily: fonts.heading,
          color: colors.inkBrown,
          fontSize: "1.5rem",
          fontWeight: 500,
          margin: "0 0 1rem",
        }}>
          {t("status.preOpenTitle")}
        </h2>

        <p style={{
          fontSize: "0.9rem",
          color: colors.warmBrown,
          margin: "0 0 1.25rem",
          lineHeight: 1.6,
        }}>
          {t("status.preOpenDescription")}
        </p>

        <div style={{
          display: "inline-block",
          padding: "0.75rem 2rem",
          background: colors.overlayWhite,
          border: `1px solid ${colors.overlayBorder}`,
          borderRadius: 10,
          marginBottom: "1.25rem",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            margin: "0 0 0.25rem",
            color: colors.warmBrown,
          }}>
            {t("status.openingDatetime")}
          </p>
          <p style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            margin: 0,
            color: colors.inkBrown,
          }}>
            <time dateTime={openingDatetime}>{formattedDate}</time>
          </p>
        </div>

        <p style={{
          fontSize: "0.9rem",
          color: colors.warmBrown,
          margin: "0",
        }}>
          {t("status.eligibility")}
        </p>
      </div>
    </section>
  );
}
