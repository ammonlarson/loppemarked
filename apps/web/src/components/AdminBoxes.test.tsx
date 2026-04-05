import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { AdminBoxes } from "./AdminBoxes";

vi.mock("@/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn(), t: (key: string) => key }),
}));

Element.prototype.scrollIntoView = vi.fn();

vi.mock("./NotificationComposer", () => ({
  NotificationComposer: () => <div data-testid="notification-composer" />,
}));

const mockBoxes = [
  { id: 1, name: "Linaria", greenhouse: "Kronen", state: "available", registration: null },
  { id: 2, name: "Harebell", greenhouse: "Kronen", state: "occupied", registration: { id: "r1", name: "Alice", email: "alice@test.com", language: "en" } },
  { id: 3, name: "Larkspur", greenhouse: "Kronen", state: "reserved", registration: null },
];

describe("AdminBoxes", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders boxes with action buttons", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    expect(screen.getByText("admin.boxes.title")).toBeDefined();
    expect(screen.getByText("Linaria")).toBeDefined();
    expect(screen.getByText("admin.boxes.reserve")).toBeDefined();
    expect(screen.getByText("admin.boxes.removeRegistration")).toBeDefined();
    expect(screen.getByText("admin.boxes.release")).toBeDefined();
  });

  it("shows reserve dialog when Reserve is clicked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.boxes.reserve"));
    });

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText(/admin.boxes.confirmReserve/)).toBeDefined();
  });

  it("calls reserve API when confirmed", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockBoxes })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ boxId: 1, state: "reserved" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockBoxes });

    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      render(<AdminBoxes />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.boxes.reserve"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("common.confirm"));
    });

    const reserveCall = fetchMock.mock.calls[1];
    expect(reserveCall[0]).toBe("/admin/boxes/reserve");
    expect(JSON.parse(reserveCall[1].body)).toEqual({ boxId: 1 });
  });

  it("shows release dialog when Release is clicked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.boxes.release"));
    });

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText(/admin.boxes.confirmRelease/)).toBeDefined();
  });

  it("shows remove registration dialog with notification composer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.boxes.removeRegistration"));
    });

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText(/admin.boxes.confirmRemoveRegistration/)).toBeDefined();
    expect(screen.getByText(/admin.boxes.occupiedBy/)).toBeDefined();
    expect(screen.getByTestId("notification-composer")).toBeDefined();
  });

  it("shows add registration dialog for available boxes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    const addButtons = screen.getAllByText("admin.boxes.addRegistration");
    await act(async () => {
      fireEvent.click(addButtons[0]);
    });

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByLabelText(/admin.registrations.addName/)).toBeDefined();
    expect(screen.getByLabelText(/admin.registrations.addEmail/)).toBeDefined();
  });

  it("defaults language to English when add-registration dialog opens", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    const addButtons = screen.getAllByText("admin.boxes.addRegistration");
    await act(async () => {
      fireEvent.click(addButtons[0]);
    });

    const languageSelect = screen.getByLabelText(/admin.registrations.addLanguage/) as HTMLSelectElement;
    expect(languageSelect.value).toBe("en");
  });

  it("scrolls add-registration dialog into view when opened", async () => {
    const scrollMock = vi.fn();
    Element.prototype.scrollIntoView = scrollMock;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    const addButtons = screen.getAllByText("admin.boxes.addRegistration");
    await act(async () => {
      fireEvent.click(addButtons[0]);
    });

    expect(scrollMock).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
  });

  it("scrolls remove-registration dialog into view when opened", async () => {
    const scrollMock = vi.fn();
    Element.prototype.scrollIntoView = scrollMock;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.boxes.removeRegistration"));
    });

    expect(scrollMock).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
  });

  it("shows registrant name next to occupied box", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    expect(screen.getByText("(Alice)")).toBeDefined();
  });

  it("shows error state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));

    await act(async () => {
      render(<AdminBoxes />);
    });

    expect(screen.getByText("common.error")).toBeDefined();
  });

  it("disables action buttons when a dialog is open", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBoxes,
    }));

    await act(async () => {
      render(<AdminBoxes />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.boxes.reserve"));
    });

    const removeBtn = screen.getByText("admin.boxes.removeRegistration");
    expect(removeBtn.hasAttribute("disabled")).toBe(true);
  });
});
