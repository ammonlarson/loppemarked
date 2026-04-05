import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LandingPage } from "./LandingPage";

vi.mock("@/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en", ready: true, setLanguage: vi.fn(), t: (key: string) => key }),
}));

vi.mock("./GreenhouseCard", () => ({
  GreenhouseCard: ({ name }: { name: string }) => <div data-testid={`card-${name}`}>{name}</div>,
}));

vi.mock("./WaitlistBanner", () => ({
  WaitlistBanner: ({ onJoinWaitlist }: { onJoinWaitlist?: () => void }) => (
    <div data-testid="waitlist-banner">
      {onJoinWaitlist && (
        <button type="button" data-testid="join-waitlist-btn" onClick={onJoinWaitlist}>
          Join
        </button>
      )}
    </div>
  ),
}));

describe("LandingPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders greenhouse cards from passed data", () => {
    const greenhouses = [
      { name: "Kronen" as const, totalBoxes: 14, availableBoxes: 5, occupiedBoxes: 9 },
      { name: "Søen" as const, totalBoxes: 15, availableBoxes: 3, occupiedBoxes: 12 },
    ];

    render(<LandingPage greenhouses={greenhouses} />);

    expect(screen.getByTestId("card-Kronen")).toBeDefined();
    expect(screen.getByTestId("card-Søen")).toBeDefined();
  });

  it("renders fallback cards when greenhouses is empty", () => {
    render(<LandingPage greenhouses={[]} />);

    expect(screen.getByTestId("card-Kronen")).toBeDefined();
    expect(screen.getByTestId("card-Søen")).toBeDefined();
  });

  it("does not show waitlist banner when hasAvailableBoxes is true", () => {
    render(<LandingPage hasAvailableBoxes />);

    expect(screen.queryByTestId("waitlist-banner")).toBeNull();
  });

  it("shows waitlist banner with join button when hasAvailableBoxes is false", () => {
    const handler = vi.fn();
    render(<LandingPage hasAvailableBoxes={false} onJoinWaitlist={handler} />);

    expect(screen.getByTestId("waitlist-banner")).toBeDefined();
    expect(screen.getByTestId("join-waitlist-btn")).toBeDefined();
  });

  it("does not show join button when onJoinWaitlist is not provided", () => {
    render(<LandingPage hasAvailableBoxes={false} />);

    expect(screen.getByTestId("waitlist-banner")).toBeDefined();
    expect(screen.queryByTestId("join-waitlist-btn")).toBeNull();
  });
});
