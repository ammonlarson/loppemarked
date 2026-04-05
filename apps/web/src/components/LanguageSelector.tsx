"use client";

import { LANGUAGES, LANGUAGE_LABELS, type Language } from "@greenspace/shared";
import { useLanguage } from "@/i18n/LanguageProvider";
import { colors, fonts } from "@/styles/theme";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-selector" style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {LANGUAGES.map((lang: Language, i: number) => (
        <span key={lang} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 && (
            <span style={{ color: colors.borderTan, fontSize: "0.875rem", margin: "0 2px" }}>|</span>
          )}
          <button
            onClick={() => setLanguage(lang)}
            aria-current={lang === language ? "true" : undefined}
            style={{
              fontWeight: lang === language ? 700 : 400,
              textDecoration: lang === language ? "underline" : "none",
              textUnderlineOffset: "3px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 6px",
              fontSize: "0.875rem",
              fontFamily: fonts.body,
              color: colors.inkBrown,
            }}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        </span>
      ))}
    </div>
  );
}
