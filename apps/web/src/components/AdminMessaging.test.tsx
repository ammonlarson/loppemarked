import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import { AdminMessaging } from "./AdminMessaging";

vi.mock("@/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn(), t: (key: string) => key }),
}));

function mockFetch(overrides: Record<string, unknown> = {}) {
  const defaultResponses: Record<string, unknown> = {
    "/admin/messaging/recipients": { count: 5, recipients: [] },
    "/admin/messaging/template": { defaultBody: "<p>Default template</p>", language: "en" },
    "/admin/messaging/preview": { previewHtml: "<html><body>Preview</body></html>" },
    ...overrides,
  };

  return vi.fn().mockImplementation((url: string) => {
    const data = defaultResponses[url] ?? {};
    return Promise.resolve({
      ok: true,
      json: async () => data,
    });
  });
}

describe("AdminMessaging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders title and audience options", async () => {
    vi.stubGlobal("fetch", mockFetch());

    await act(async () => {
      render(<AdminMessaging />);
    });

    expect(screen.getByText("admin.messaging.title")).toBeDefined();
    expect(screen.getByText("admin.messaging.audienceAll")).toBeDefined();
    expect(screen.getByText("admin.messaging.audienceKronen")).toBeDefined();
    expect(screen.getByText("admin.messaging.audienceSøen")).toBeDefined();
  });

  it("fetches recipient count on mount", async () => {
    const fetchMock = mockFetch({
      "/admin/messaging/recipients": { count: 12, recipients: [] },
    });
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      render(<AdminMessaging />);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/admin/messaging/recipients",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ audience: "all" }),
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "12 admin.messaging.recipientCount (0 admin.messaging.englishCount, 0 admin.messaging.danishCount)",
        ),
      ).toBeDefined();
    });
  });

  it("fetches default templates on mount and prefills body", async () => {
    const fetchMock = mockFetch({
      "/admin/messaging/template": { defaultBody: "<p>Hello template</p>", language: "en" },
    });
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      render(<AdminMessaging />);
    });

    const templateCalls = fetchMock.mock.calls.filter(
      (c: unknown[]) => (c[0] as string) === "/admin/messaging/template",
    );
    expect(templateCalls.length).toBe(3);

    const textarea = screen.getByLabelText("admin.messaging.body") as HTMLTextAreaElement;
    expect(textarea.value).toBe("<p>Hello template</p>");
  });

  it("re-fetches recipients when audience changes", async () => {
    const fetchMock = mockFetch({
      "/admin/messaging/recipients": { count: 3, recipients: [] },
    });
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      render(<AdminMessaging />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.audienceKronen"));
    });

    const calls = fetchMock.mock.calls.filter(
      (c: unknown[]) => (c[0] as string) === "/admin/messaging/recipients",
    );
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  it("shows error when subject is empty on send", async () => {
    vi.stubGlobal("fetch", mockFetch({
      "/admin/messaging/recipients": { count: 5, recipients: [{ email: "a@b.com", name: "A", language: "da" }] },
    }));

    await act(async () => {
      render(<AdminMessaging />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.send"));
    });

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("admin.messaging.subjectRequired")).toBeDefined();
  });

  it("renders subject input and body textarea", async () => {
    vi.stubGlobal("fetch", mockFetch());

    await act(async () => {
      render(<AdminMessaging />);
    });

    expect(screen.getByLabelText("admin.messaging.body")).toBeDefined();
    const subjectInput = document.getElementById("messaging-subject");
    expect(subjectInput).toBeDefined();
  });

  it("shows language preference breakdown in recipient count", async () => {
    const recipients = [
      { email: "a@b.com", name: "Alice", language: "en" },
      { email: "b@b.com", name: "Bob", language: "da" },
      { email: "c@b.com", name: "Charlie", language: "en" },
      { email: "d@b.com", name: "Diana", language: "da" },
      { email: "e@b.com", name: "Eve", language: "en" },
    ];
    vi.stubGlobal("fetch", mockFetch({
      "/admin/messaging/recipients": { count: 5, recipients },
    }));

    await act(async () => {
      render(<AdminMessaging />);
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "5 admin.messaging.recipientCount (3 admin.messaging.englishCount, 2 admin.messaging.danishCount)",
        ),
      ).toBeDefined();
    });
  });

  it("switches between preview and source tabs", async () => {
    vi.stubGlobal("fetch", mockFetch());

    await act(async () => {
      render(<AdminMessaging />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.preview"));
    });

    expect(screen.getByTitle("admin.messaging.preview")).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.source"));
    });

    expect(screen.getByLabelText("admin.messaging.body")).toBeDefined();
  });

  it("renders bilingual toggle checkbox", async () => {
    vi.stubGlobal("fetch", mockFetch());

    await act(async () => {
      render(<AdminMessaging />);
    });

    const toggle = document.getElementById("bilingual-toggle") as HTMLInputElement;
    expect(toggle).toBeDefined();
    expect(toggle.checked).toBe(false);
  });

  it("shows two editor sections when bilingual is enabled", async () => {
    vi.stubGlobal("fetch", mockFetch({
      "/admin/messaging/recipients": { count: 2, recipients: [{ email: "a@b.com", name: "A", language: "da" }] },
    }));

    await act(async () => {
      render(<AdminMessaging />);
    });

    await act(async () => {
      fireEvent.click(document.getElementById("bilingual-toggle")!);
    });

    expect(screen.getByText("admin.messaging.danishVersion")).toBeDefined();
    expect(screen.getByText("admin.messaging.englishVersion")).toBeDefined();
    expect(document.getElementById("messaging-da-subject")).toBeDefined();
    expect(document.getElementById("messaging-en-subject")).toBeDefined();
  });

  it("validates all bilingual fields before send", async () => {
    vi.stubGlobal("fetch", mockFetch({
      "/admin/messaging/recipients": { count: 2, recipients: [{ email: "a@b.com", name: "A", language: "da" }] },
    }));

    await act(async () => {
      render(<AdminMessaging />);
    });

    await act(async () => {
      fireEvent.click(document.getElementById("bilingual-toggle")!);
    });

    const daTextarea = screen.getByLabelText("admin.messaging.body (DA)") as HTMLTextAreaElement;
    const enTextarea = screen.getByLabelText("admin.messaging.body (EN)") as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(daTextarea, { target: { value: "" } });
      fireEvent.change(enTextarea, { target: { value: "" } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.send"));
    });

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("admin.messaging.subjectDaRequired")).toBeDefined();
  });

  it("sends bilingual payload when bilingual mode is active", async () => {
    const recipients = [{ email: "a@b.com", name: "A", language: "da" }];
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/admin/messaging/recipients") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ count: 1, recipients }),
        });
      }
      if (url === "/admin/messaging/template") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ defaultBody: "<p>Template</p>", language: "en" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ queuedCount: 1, recipientCount: 1 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", () => true);

    await act(async () => {
      render(<AdminMessaging />);
    });

    await act(async () => {
      fireEvent.click(document.getElementById("bilingual-toggle")!);
    });

    await act(async () => {
      fireEvent.change(document.getElementById("messaging-da-subject")!, { target: { value: "Dansk emne" } });
    });

    const daTextarea = screen.getByLabelText("admin.messaging.body (DA)");
    await act(async () => {
      fireEvent.change(daTextarea, { target: { value: "<p>Dansk</p>" } });
    });

    await act(async () => {
      fireEvent.change(document.getElementById("messaging-en-subject")!, { target: { value: "English subject" } });
    });

    const enTextarea = screen.getByLabelText("admin.messaging.body (EN)");
    await act(async () => {
      fireEvent.change(enTextarea, { target: { value: "<p>English</p>" } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.send"));
    });

    const sendCall = fetchMock.mock.calls.find(
      (c: unknown[]) => (c[0] as string) === "/admin/messaging/send",
    );
    expect(sendCall).toBeDefined();
    const sentBody = JSON.parse((sendCall![1] as { body: string }).body);
    expect(sentBody.bilingual).toBe(true);
    expect(sentBody.subjectDa).toBe("Dansk emne");
    expect(sentBody.bodyHtmlDa).toBe("<p>Dansk</p>");
    expect(sentBody.subjectEn).toBe("English subject");
    expect(sentBody.bodyHtmlEn).toBe("<p>English</p>");
  });

  it("sends single-language payload when bilingual is off", async () => {
    const recipients = [{ email: "a@b.com", name: "A", language: "da" }];
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/admin/messaging/recipients") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ count: 1, recipients }),
        });
      }
      if (url === "/admin/messaging/template") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ defaultBody: "<p>Template</p>", language: "en" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ queuedCount: 1, recipientCount: 1 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", () => true);

    await act(async () => {
      render(<AdminMessaging />);
    });

    await act(async () => {
      fireEvent.change(document.getElementById("messaging-subject")!, { target: { value: "Test" } });
    });

    const textarea = screen.getByLabelText("admin.messaging.body");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "<p>Test</p>" } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.send"));
    });

    const sendCall = fetchMock.mock.calls.find(
      (c: unknown[]) => (c[0] as string) === "/admin/messaging/send",
    );
    expect(sendCall).toBeDefined();
    const sentBody = JSON.parse((sendCall![1] as { body: string }).body);
    expect(sentBody.bilingual).toBeUndefined();
    expect(sentBody.subject).toBe("Test");
    expect(sentBody.bodyHtml).toBe("<p>Test</p>");
  });

  it("resets body to default template when reset button is clicked", async () => {
    vi.stubGlobal("fetch", mockFetch({
      "/admin/messaging/template": { defaultBody: "<p>Original template</p>", language: "en" },
    }));

    await act(async () => {
      render(<AdminMessaging />);
    });

    const textarea = screen.getByLabelText("admin.messaging.body") as HTMLTextAreaElement;
    expect(textarea.value).toBe("<p>Original template</p>");

    await act(async () => {
      fireEvent.change(textarea, { target: { value: "<p>Modified content</p>" } });
    });
    expect(textarea.value).toBe("<p>Modified content</p>");

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.resetTemplate"));
    });

    expect(textarea.value).toBe("<p>Original template</p>");
  });

  it("shows template hint text", async () => {
    vi.stubGlobal("fetch", mockFetch());

    await act(async () => {
      render(<AdminMessaging />);
    });

    expect(screen.getByText("admin.messaging.templateHint")).toBeDefined();
  });

  it("fetches wrapped preview when switching to preview tab", async () => {
    const fetchMock = mockFetch({
      "/admin/messaging/template": { defaultBody: "<p>Template body</p>", language: "en" },
      "/admin/messaging/preview": { previewHtml: "<html><body><p>Wrapped preview</p></body></html>" },
    });
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      render(<AdminMessaging />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.preview"));
    });

    await waitFor(() => {
      const previewCalls = fetchMock.mock.calls.filter(
        (c: unknown[]) => (c[0] as string) === "/admin/messaging/preview",
      );
      expect(previewCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("resets body to template after successful send", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/admin/messaging/template") {
        return Promise.resolve({ ok: true, json: async () => ({ defaultBody: "<p>Default</p>", language: "en" }) });
      }
      if (url === "/admin/messaging/recipients") {
        return Promise.resolve({ ok: true, json: async () => ({ count: 1, recipients: [{ email: "a@b.com", name: "A", language: "en" }] }) });
      }
      if (url === "/admin/messaging/send") {
        return Promise.resolve({ ok: true, json: async () => ({ queuedCount: 1, recipientCount: 1 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      render(<AdminMessaging />);
    });

    const subjectInput = document.getElementById("messaging-subject") as HTMLInputElement;
    const textarea = screen.getByLabelText("admin.messaging.body") as HTMLTextAreaElement;

    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: "Test Subject" } });
      fireEvent.change(textarea, { target: { value: "<p>Custom body</p>" } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText("admin.messaging.send"));
    });

    expect(textarea.value).toBe("<p>Default</p>");
  });

  it("works with empty body when template fetch fails", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/admin/messaging/template") {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ count: 0, recipients: [] }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      render(<AdminMessaging />);
    });

    const textarea = screen.getByLabelText("admin.messaging.body") as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
  });
});
