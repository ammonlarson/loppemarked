import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSplash } from "./LoadingSplash";

describe("LoadingSplash", () => {
  it("renders with aria-busy and loading label", () => {
    render(<LoadingSplash />);
    const splash = screen.getByTestId("loading-splash");
    expect(splash.getAttribute("role")).toBe("status");
    expect(splash.getAttribute("aria-busy")).toBe("true");
    expect(splash.getAttribute("aria-label")).toBe("Loading");
  });

  it("renders a spinner with reduced-motion support", () => {
    const { container } = render(<LoadingSplash />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("splash-spin");
    expect(style?.textContent).toContain("prefers-reduced-motion");
  });
});
