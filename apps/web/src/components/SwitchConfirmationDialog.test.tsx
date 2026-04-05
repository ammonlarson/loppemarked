import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SwitchConfirmationDialog, type SwitchDetails } from "./SwitchConfirmationDialog";

vi.mock("@/i18n/LanguageProvider", () => ({
  useLanguage: () => ({
    language: "en",
    t: (key: string) => {
      const translations: Record<string, string> = {
        "registration.switchTitle": "Confirm box switch",
        "registration.switchCurrentBox": "Your current box",
        "registration.switchNewBox": "New box",
        "registration.switchExplainer":
          "Each apartment may only have one active planter box. If you continue, your current box will be released and you will be registered for the new box. This action cannot be undone.",
        "registration.switchKeep": "Keep current box",
        "registration.switchConfirm": "Confirm switch",
        "common.loading": "Loading...",
      };
      return translations[key] ?? key;
    },
  }),
}));

const defaultSwitchDetails: SwitchDetails = {
  existingBoxId: 5,
  existingBoxName: "Bed 5",
  existingGreenhouse: "Kronen",
  newBoxId: 20,
  newBoxName: "Bed 20",
  newGreenhouse: "Søen",
};

afterEach(cleanup);

describe("SwitchConfirmationDialog", () => {
  it("renders dialog with current and new box details", () => {
    render(
      <SwitchConfirmationDialog
        switchDetails={defaultSwitchDetails}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText("Confirm box switch")).toBeDefined();
    expect(screen.getByTestId("current-box")).toBeDefined();
    expect(screen.getByTestId("new-box")).toBeDefined();
    expect(screen.getByText(/Bed 5/)).toBeDefined();
    expect(screen.getByText(/Kronen/)).toBeDefined();
    expect(screen.getByText(/Bed 20/)).toBeDefined();
    expect(screen.getByText(/Søen/)).toBeDefined();
  });

  it("renders the explainer text", () => {
    render(
      <SwitchConfirmationDialog
        switchDetails={defaultSwitchDetails}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText(/cannot be undone/)).toBeDefined();
  });

  it("has accessible alertdialog role", () => {
    render(
      <SwitchConfirmationDialog
        switchDetails={defaultSwitchDetails}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeDefined();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <SwitchConfirmationDialog
        switchDetails={defaultSwitchDetails}
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByText("Keep current box"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <SwitchConfirmationDialog
        switchDetails={defaultSwitchDetails}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );

    await user.click(screen.getByText("Confirm switch"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables buttons and shows loading text when confirming", () => {
    render(
      <SwitchConfirmationDialog
        switchDetails={defaultSwitchDetails}
        onConfirm={() => {}}
        onCancel={() => {}}
        confirming={true}
      />,
    );

    expect(screen.getByText("Loading...")).toBeDefined();

    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toHaveProperty("disabled", true);
    }
  });

  it("shows box names in the display", () => {
    render(
      <SwitchConfirmationDialog
        switchDetails={defaultSwitchDetails}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText("Bed 5")).toBeDefined();
    expect(screen.getByText("Bed 20")).toBeDefined();
  });
});
