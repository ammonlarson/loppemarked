import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./LanguageProvider";

const STORAGE_KEY = "loppemarked-language";

function ReadyIndicator() {
  const { ready } = useLanguage();
  return <span data-testid="ready">{String(ready)}</span>;
}

function LanguageDisplay() {
  const { language, setLanguage } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <button data-testid="switch-en" onClick={() => setLanguage("en")}>EN</button>
      <button data-testid="switch-da" onClick={() => setLanguage("da")}>DA</button>
    </div>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("starts not ready and becomes ready after mount", async () => {
    render(
      <LanguageProvider>
        <ReadyIndicator />
      </LanguageProvider>,
    );

    await act(async () => {});

    const el = screen.getByTestId("ready");
    expect(el.textContent).toBe("true");
  });

  it("exposes ready flag in context", async () => {
    render(
      <LanguageProvider>
        <ReadyIndicator />
      </LanguageProvider>,
    );

    await act(async () => {});

    expect(screen.getByTestId("ready").textContent).toBe("true");
  });

  it("persists detected language to localStorage on first visit", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");

    render(
      <LanguageProvider>
        <LanguageDisplay />
      </LanguageProvider>,
    );

    await act(async () => {});

    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });

  it("uses stored language on subsequent visit", async () => {
    localStorage.setItem(STORAGE_KEY, "en");
    vi.spyOn(navigator, "language", "get").mockReturnValue("da");

    render(
      <LanguageProvider>
        <LanguageDisplay />
      </LanguageProvider>,
    );

    await act(async () => {});

    expect(screen.getByTestId("lang").textContent).toBe("en");
  });

  it("persists manual language change to localStorage", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("da");

    render(
      <LanguageProvider>
        <LanguageDisplay />
      </LanguageProvider>,
    );

    await act(async () => {});

    expect(screen.getByTestId("lang").textContent).toBe("da");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("da");

    await act(async () => {
      screen.getByTestId("switch-en").click();
    });

    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");
  });

  it("ignores invalid stored language and falls back to detection", async () => {
    localStorage.setItem(STORAGE_KEY, "fr");
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-GB");

    render(
      <LanguageProvider>
        <LanguageDisplay />
      </LanguageProvider>,
    );

    await act(async () => {});

    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");
  });

  it("falls back to default language when browser language is unsupported", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("fr-FR");

    render(
      <LanguageProvider>
        <LanguageDisplay />
      </LanguageProvider>,
    );

    await act(async () => {});

    expect(screen.getByTestId("lang").textContent).toBe("da");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("da");
  });
});
