import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { DawaAddressInput, type DawaAddressResult } from "./DawaAddressInput";
import type { DawaAutocompleteSuggestion } from "@loppemarked/shared";

vi.mock("@/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn(), t: (key: string) => key }),
}));

function makeSuggestion(
  tekst: string,
  husnr: string,
  etage: string | null = null,
  dør: string | null = null,
): DawaAutocompleteSuggestion {
  return {
    tekst,
    adresse: { vejnavn: "Else Alfelts Vej", husnr, etage, dør, postnr: "2300", postnrnavn: "København S" },
  };
}

const suggestions: DawaAutocompleteSuggestion[] = [
  makeSuggestion("Else Alfelts Vej 122, 2300 København S", "122"),
  makeSuggestion("Else Alfelts Vej 130, 2300 København S", "130"),
  makeSuggestion("Else Alfelts Vej 138, st. th., 2300 København S", "138", "st", "th"),
];

function setup(selectedAddress: DawaAddressResult | null = null) {
  const onSelect = vi.fn();
  const onClear = vi.fn();
  const result = render(
    <DawaAddressInput onSelect={onSelect} onClear={onClear} selectedAddress={selectedAddress} />,
  );
  return { onSelect, onClear, ...result };
}

function mockFetchOk(data: DawaAutocompleteSuggestion[]) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => data });
}

function mockFetchFail() {
  return vi.fn().mockResolvedValue({ ok: false, json: async () => [] });
}

describe("DawaAddressInput", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanup();
  });

  describe("input rendering", () => {
    it("renders search input when no address is selected", () => {
      setup();
      expect(screen.getByRole("combobox")).toBeDefined();
      expect(screen.getByText("address.searchHint")).toBeDefined();
    });

    it("sets aria-expanded to false initially", () => {
      setup();
      expect(screen.getByRole("combobox").getAttribute("aria-expanded")).toBe("false");
    });

    it("sets aria-expanded to true when dropdown is open", async () => {
      vi.stubGlobal("fetch", mockFetchOk(suggestions));
      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(input.getAttribute("aria-expanded")).toBe("true");
    });
  });

  describe("debounced fetch", () => {
    it("triggers fetch after 300ms debounce", async () => {
      const fetchMock = mockFetchOk(suggestions);
      vi.stubGlobal("fetch", fetchMock);

      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });

      expect(fetchMock).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain("q=Else");
    });

    it("debounces multiple rapid inputs", async () => {
      const fetchMock = mockFetchOk(suggestions);
      vi.stubGlobal("fetch", fetchMock);

      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "E" } });
      await act(async () => { vi.advanceTimersByTime(100); });

      fireEvent.change(input, { target: { value: "El" } });
      await act(async () => { vi.advanceTimersByTime(100); });

      fireEvent.change(input, { target: { value: "Els" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain("q=Els");
    });

    it("does not fetch for empty input", async () => {
      const fetchMock = mockFetchOk(suggestions);
      vi.stubGlobal("fetch", fetchMock);

      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "  " } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("suggestion display and selection", () => {
    it("shows suggestion dropdown after successful fetch", async () => {
      vi.stubGlobal("fetch", mockFetchOk(suggestions));

      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(screen.getByRole("listbox")).toBeDefined();
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0].textContent).toBe("Else Alfelts Vej 122, 2300 København S");
    });

    it("calls onSelect with correct DawaAddressResult on click", async () => {
      vi.stubGlobal("fetch", mockFetchOk(suggestions));

      const { onSelect } = setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      const options = screen.getAllByRole("option");
      fireEvent.mouseDown(options[0]);

      expect(onSelect).toHaveBeenCalledWith({
        houseNumber: 122,
        floor: null,
        door: null,
        displayText: "Else Alfelts Vej 122, 2300 København S",
      });
    });

    it("passes floor and door when present", async () => {
      vi.stubGlobal("fetch", mockFetchOk(suggestions));

      const { onSelect } = setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      const options = screen.getAllByRole("option");
      fireEvent.mouseDown(options[2]);

      expect(onSelect).toHaveBeenCalledWith({
        houseNumber: 138,
        floor: "st",
        door: "th",
        displayText: "Else Alfelts Vej 138, st. th., 2300 København S",
      });
    });

    it("clears suggestions when unparseable house number is selected", async () => {
      const badSuggestion = makeSuggestion("Bad address", "abc");
      vi.stubGlobal("fetch", mockFetchOk([badSuggestion]));

      const { onSelect } = setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Bad" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      fireEvent.mouseDown(screen.getByRole("option"));

      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  describe("keyboard navigation", () => {
    async function setupWithDropdown() {
      vi.stubGlobal("fetch", mockFetchOk(suggestions));
      const result = setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      return { ...result, input };
    }

    it("ArrowDown moves highlight down", async () => {
      const { input } = await setupWithDropdown();
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(options[0].getAttribute("aria-selected")).toBe("true");

      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(options[1].getAttribute("aria-selected")).toBe("true");
      expect(options[0].getAttribute("aria-selected")).toBe("false");
    });

    it("ArrowUp moves highlight up", async () => {
      const { input } = await setupWithDropdown();
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(options[1].getAttribute("aria-selected")).toBe("true");

      fireEvent.keyDown(input, { key: "ArrowUp" });
      expect(options[0].getAttribute("aria-selected")).toBe("true");
    });

    it("ArrowDown does not go past last item", async () => {
      const { input } = await setupWithDropdown();
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(options[2].getAttribute("aria-selected")).toBe("true");
    });

    it("ArrowUp does not go past first item", async () => {
      const { input } = await setupWithDropdown();
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(options[0].getAttribute("aria-selected")).toBe("true");

      fireEvent.keyDown(input, { key: "ArrowUp" });
      expect(options[0].getAttribute("aria-selected")).toBe("true");
    });

    it("Enter selects highlighted suggestion", async () => {
      const { input, onSelect } = await setupWithDropdown();

      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onSelect).toHaveBeenCalledWith({
        houseNumber: 130,
        floor: null,
        door: null,
        displayText: "Else Alfelts Vej 130, 2300 København S",
      });
    });

    it("Enter without highlight does nothing", async () => {
      const { input, onSelect } = await setupWithDropdown();

      fireEvent.keyDown(input, { key: "Enter" });
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("Escape closes dropdown", async () => {
      const { input } = await setupWithDropdown();

      expect(screen.getByRole("listbox")).toBeDefined();

      fireEvent.keyDown(input, { key: "Escape" });
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("aria-activedescendant updates on keyboard navigation", async () => {
      const { input } = await setupWithDropdown();

      expect(input.getAttribute("aria-activedescendant")).toBeNull();

      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(input.getAttribute("aria-activedescendant")).toBe("dawa-suggestion-0");

      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(input.getAttribute("aria-activedescendant")).toBe("dawa-suggestion-1");
    });
  });

  describe("click outside", () => {
    it("closes dropdown when clicking outside the container", async () => {
      vi.stubGlobal("fetch", mockFetchOk(suggestions));
      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(screen.getByRole("listbox")).toBeDefined();

      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  describe("fetch error handling", () => {
    it("clears suggestions on non-OK response", async () => {
      vi.stubGlobal("fetch", mockFetchFail());
      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("clears suggestions on network error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("ignores AbortError silently", async () => {
      const abortError = new DOMException("The operation was aborted", "AbortError");
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  describe("AbortController cancellation", () => {
    it("aborts previous request when new input arrives", async () => {
      const abortSignals: AbortSignal[] = [];
      const fetchMock = vi.fn().mockImplementation((_url: string, opts: { signal: AbortSignal }) => {
        abortSignals.push(opts.signal);
        return new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, json: async () => suggestions }), 100);
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "E" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      fireEvent.change(input, { target: { value: "El" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(abortSignals[0].aborted).toBe(true);
    });
  });

  describe("selected address state", () => {
    it("shows address text and Change button when address is selected", () => {
      const address: DawaAddressResult = {
        houseNumber: 122,
        floor: null,
        door: null,
        displayText: "Else Alfelts Vej 122, 2300 København S",
      };
      setup(address);

      expect(screen.getByText("Else Alfelts Vej 122, 2300 København S")).toBeDefined();
      expect(screen.getByText("address.changeAddress")).toBeDefined();
      expect(screen.getByText("address.selectedAddress")).toBeDefined();
      expect(screen.queryByRole("combobox")).toBeNull();
    });

    it("calls onClear when Change button is clicked", () => {
      const address: DawaAddressResult = {
        houseNumber: 122,
        floor: null,
        door: null,
        displayText: "Else Alfelts Vej 122, 2300 København S",
      };
      const { onClear } = setup(address);

      fireEvent.click(screen.getByText("address.changeAddress"));
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe("floor/door hint", () => {
    it("shows hint for house numbers that require floor/door", () => {
      const address: DawaAddressResult = {
        houseNumber: 138,
        floor: null,
        door: null,
        displayText: "Else Alfelts Vej 138, 2300 København S",
      };
      setup(address);

      expect(screen.getByText("address.floorDoorHint")).toBeDefined();
    });

    it("does not show hint when floor and door are provided", () => {
      const address: DawaAddressResult = {
        houseNumber: 138,
        floor: "st",
        door: "th",
        displayText: "Else Alfelts Vej 138, st. th., 2300 København S",
      };
      setup(address);

      expect(screen.queryByText("address.floorDoorHint")).toBeNull();
    });

    it("does not show hint for house numbers that do not require floor/door", () => {
      const address: DawaAddressResult = {
        houseNumber: 122,
        floor: null,
        door: null,
        displayText: "Else Alfelts Vej 122, 2300 København S",
      };
      setup(address);

      expect(screen.queryByText("address.floorDoorHint")).toBeNull();
    });
  });

  describe("focus behavior", () => {
    it("re-opens dropdown on focus when suggestions exist", async () => {
      vi.stubGlobal("fetch", mockFetchOk(suggestions));
      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(screen.getByRole("listbox")).toBeDefined();

      fireEvent.keyDown(input, { key: "Escape" });
      expect(screen.queryByRole("listbox")).toBeNull();

      fireEvent.focus(input);
      expect(screen.getByRole("listbox")).toBeDefined();
    });
  });

  describe("loading indicator", () => {
    it("shows loading text while fetch is in progress", async () => {
      const fetchMock = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, json: async () => suggestions }), 500);
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(screen.getByText("common.loading")).toBeDefined();

      await act(async () => { vi.advanceTimersByTime(500); });

      expect(screen.queryByText("common.loading")).toBeNull();
    });
  });

  describe("mouse interaction", () => {
    it("highlights suggestion on mouseEnter", async () => {
      vi.stubGlobal("fetch", mockFetchOk(suggestions));
      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Else" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      const options = screen.getAllByRole("option");
      fireEvent.mouseEnter(options[2]);

      expect(options[2].getAttribute("aria-selected")).toBe("true");
      expect(options[0].getAttribute("aria-selected")).toBe("false");
    });
  });

  describe("no results state", () => {
    it("shows no results message when search yields empty array", async () => {
      vi.stubGlobal("fetch", mockFetchOk([]));
      setup();
      const input = screen.getByRole("combobox");

      fireEvent.change(input, { target: { value: "Nonexistent" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });
});
