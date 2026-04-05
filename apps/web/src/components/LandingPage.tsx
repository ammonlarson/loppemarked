"use client";

import {
  GREENHOUSES,
  type Greenhouse,
  type GreenhouseSummary,
} from "@loppemarked/shared";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fonts, colors } from "@/styles/theme";
import { GreenhouseCard } from "./GreenhouseCard";
import { WaitlistBanner } from "./WaitlistBanner";

interface LandingPageProps {
  greenhouses?: GreenhouseSummary[];
  onSelectGreenhouse?: (greenhouse: Greenhouse) => void;
  hasAvailableBoxes?: boolean;
  onJoinWaitlist?: () => void;
}
export function LandingPage({ greenhouses = [], onSelectGreenhouse, hasAvailableBoxes = true, onJoinWaitlist }: LandingPageProps) {
  const { t } = useLanguage();
  const displayGreenhouses = greenhouses.length > 0
    ? greenhouses
    : GREENHOUSES.map((name) => ({ name, totalBoxes: 0, availableBoxes: 0, occupiedBoxes: 0 }));

  return (
    <section style={{
      maxWidth: 740,
      margin: "0 auto",
      padding: "2rem 1.5rem 1rem",
    }}>
      <h2 style={{
        textAlign: "center",
        fontFamily: fonts.heading,
        color: colors.warmBrown,
        fontWeight: 600,
        fontSize: "1.25rem",
        margin: "0 0 1.5rem",
      }}>
        {t("greenhouse.title")}
      </h2>
      <div style={{
        display: "flex",
        gap: "1.5rem",
        flexWrap: "wrap",
        alignItems: "flex-end",
      }}>
        {displayGreenhouses.map((gh) => (
          <GreenhouseCard
            key={gh.name}
            name={gh.name}
            totalBoxes={gh.totalBoxes}
            availableBoxes={gh.availableBoxes}
            occupiedBoxes={gh.occupiedBoxes}
            onSelect={onSelectGreenhouse ? () => onSelectGreenhouse(gh.name) : undefined}
          />
        ))}
      </div>
      {!hasAvailableBoxes && <WaitlistBanner onJoinWaitlist={onJoinWaitlist} />}
    </section>
  );
}
