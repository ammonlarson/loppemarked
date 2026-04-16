import Image from "next/image";
import { ORGANIZER_CONTACTS } from "@loppemarked/shared";
import { useLanguage } from "@/i18n/LanguageProvider";
import { colors, fonts } from "@/styles/theme";

export function ProjectAbout() {
  const { t } = useLanguage();

  return (
    <footer
      style={{
        maxWidth: 800,
        margin: "2rem auto 0",
        padding: "1.5rem 1rem 2rem",
        textAlign: "center",
      }}
    >
      {/* Decorative divider */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}>
        <div style={{ flex: 1, maxWidth: 200, height: 1, background: `linear-gradient(to right, transparent, ${colors.borderTan})` }} />
        <Image src="/footer.png" alt="" width={56} height={56} style={{ objectFit: "contain" }} />
        <div style={{ flex: 1, maxWidth: 200, height: 1, background: `linear-gradient(to left, transparent, ${colors.borderTan})` }} />
      </div>

      <h2
        style={{
          fontFamily: fonts.heading,
          color: colors.warmBrown,
          fontSize: "1rem",
          margin: "0 0 0.5rem",
        }}
      >
        {t("about.title")}
      </h2>
      <p
        style={{
          fontFamily: fonts.body,
          color: colors.warmBrown,
          fontSize: "0.8rem",
          lineHeight: 1.6,
          margin: "0 auto 0.75rem",
          maxWidth: 500,
        }}
      >
        {t("about.description")}
      </p>
      <p
        style={{
          fontFamily: fonts.body,
          color: colors.warmBrown,
          fontSize: "0.8rem",
          margin: "0 0 0.25rem",
        }}
      >
        {t("about.contact")}
      </p>
      <p style={{ margin: 0, fontSize: "0.8rem" }}>
        {ORGANIZER_CONTACTS.map((contact, i) => (
          <span key={contact.email}>
            {i > 0 && " · "}
            <a
              href={`mailto:${contact.email}`}
              style={{ color: colors.sage, textDecoration: "none" }}
            >
              {contact.name}
            </a>
          </span>
        ))}
      </p>
    </footer>
  );
}
