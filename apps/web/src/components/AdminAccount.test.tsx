import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { AdminAccount } from "./AdminAccount";

const stableT = (key: string) => key;
const stableSetLanguage = vi.fn();
vi.mock("@/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en", setLanguage: stableSetLanguage, t: stableT }),
}));

vi.mock("@/utils/formatDate", () => ({
  formatDate: (iso: string) => iso,
}));

const admins = [
  { id: "a1", email: "alice@test.com", created_at: "2026-01-01T00:00:00Z" },
  { id: "a2", email: "bob@test.com", created_at: "2026-02-01T00:00:00Z" },
];

function mockFetch(responses: Array<{ ok: boolean; status?: number; body: unknown }>) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      ok: resp.ok,
      status: resp.status ?? (resp.ok ? 200 : 400),
      json: async () => resp.body,
    });
  });
}

describe("AdminAccount", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  describe("admin list", () => {
    it("renders admin table after fetching", async () => {
      vi.stubGlobal("fetch", mockFetch([{ ok: true, body: admins }]));

      await act(async () => {
        render(<AdminAccount />);
      });

      expect(screen.getByText("alice@test.com")).toBeDefined();
      expect(screen.getByText("bob@test.com")).toBeDefined();
    });

    it("shows empty state when no admins", async () => {
      vi.stubGlobal("fetch", mockFetch([{ ok: true, body: [] }]));

      await act(async () => {
        render(<AdminAccount />);
      });

      expect(screen.getByText("admin.account.noAdmins")).toBeDefined();
    });
  });

  describe("create admin", () => {
    it("creates admin and refreshes list", async () => {
      const newAdmin = { id: "a3", email: "carol@test.com", created_at: "2026-03-01T00:00:00Z" };
      const fetchMock = mockFetch([
        { ok: true, body: admins },
        { ok: true, status: 201, body: newAdmin },
        { ok: true, body: [...admins, newAdmin] },
      ]);
      vi.stubGlobal("fetch", fetchMock);

      await act(async () => {
        render(<AdminAccount />);
      });

      const emailInput = screen.getAllByRole("textbox")[0];
      const passwordInputs = screen.getAllByLabelText("admin.account.createPassword");

      fireEvent.change(emailInput, { target: { value: "carol@test.com" } });
      fireEvent.change(passwordInputs[0], { target: { value: "password123" } });

      const createButton = screen.getByText("admin.account.createButton");
      await act(async () => {
        fireEvent.click(createButton);
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(screen.getByText("admin.account.createSuccess")).toBeDefined();
    });

    it("shows error on create failure", async () => {
      const fetchMock = mockFetch([
        { ok: true, body: admins },
        { ok: false, status: 409, body: { error: "Admin already exists", code: "ADMIN_EXISTS" } },
      ]);
      vi.stubGlobal("fetch", fetchMock);

      await act(async () => {
        render(<AdminAccount />);
      });

      const emailInput = screen.getAllByRole("textbox")[0];
      const passwordInputs = screen.getAllByLabelText("admin.account.createPassword");

      fireEvent.change(emailInput, { target: { value: "alice@test.com" } });
      fireEvent.change(passwordInputs[0], { target: { value: "password123" } });

      const createButton = screen.getByText("admin.account.createButton");
      await act(async () => {
        fireEvent.click(createButton);
      });

      expect(screen.getByRole("alert").textContent).toBe("Admin already exists");
    });
  });

  describe("delete admin", () => {
    it("deletes admin and refreshes list", async () => {
      const fetchMock = mockFetch([
        { ok: true, body: admins },
        { ok: true, status: 204, body: {} },
        { ok: true, body: [admins[0]] },
      ]);
      vi.stubGlobal("fetch", fetchMock);

      await act(async () => {
        render(<AdminAccount />);
      });

      const deleteButtons = screen.getAllByText("admin.account.delete");
      await act(async () => {
        fireEvent.click(deleteButtons[1]);
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      const deleteCall = fetchMock.mock.calls[1];
      expect(deleteCall[0]).toBe("/admin/admins/a2");
      expect(deleteCall[1].method).toBe("DELETE");
    });

    it("shows self-delete error", async () => {
      const fetchMock = mockFetch([
        { ok: true, body: admins },
        { ok: false, status: 400, body: { error: "Cannot delete yourself", code: "SELF_DELETE" } },
      ]);
      vi.stubGlobal("fetch", fetchMock);

      await act(async () => {
        render(<AdminAccount />);
      });

      const deleteButtons = screen.getAllByText("admin.account.delete");
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      expect(screen.getByRole("alert").textContent).toBe("admin.account.selfDeleteError");
    });

    it("does not delete when confirm is cancelled", async () => {
      vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
      const fetchMock = mockFetch([{ ok: true, body: admins }]);
      vi.stubGlobal("fetch", fetchMock);

      await act(async () => {
        render(<AdminAccount />);
      });

      const deleteButtons = screen.getAllByText("admin.account.delete");
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("change password", () => {
    it("changes password successfully", async () => {
      const fetchMock = mockFetch([
        { ok: true, body: admins },
        { ok: true, body: { message: "Password updated" } },
      ]);
      vi.stubGlobal("fetch", fetchMock);

      await act(async () => {
        render(<AdminAccount />);
      });

      const currentPwInput = screen.getByLabelText("admin.account.currentPassword");
      const newPwInput = screen.getByLabelText("admin.account.newPassword");

      fireEvent.change(currentPwInput, { target: { value: "oldpassword" } });
      fireEvent.change(newPwInput, { target: { value: "newpassword123" } });

      const changeButton = screen.getByText("admin.account.changePasswordButton");
      await act(async () => {
        fireEvent.click(changeButton);
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const changeCall = fetchMock.mock.calls[1];
      expect(changeCall[0]).toBe("/admin/auth/change-password");
      expect(JSON.parse(changeCall[1].body)).toEqual({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
      });
      expect(screen.getByText("admin.account.passwordChanged")).toBeDefined();
    });

    it("shows error for short password", async () => {
      vi.stubGlobal("fetch", mockFetch([{ ok: true, body: admins }]));

      await act(async () => {
        render(<AdminAccount />);
      });

      const currentPwInput = screen.getByLabelText("admin.account.currentPassword");
      const newPwInput = screen.getByLabelText("admin.account.newPassword");

      fireEvent.change(currentPwInput, { target: { value: "old" } });
      fireEvent.change(newPwInput, { target: { value: "short" } });

      const changeButton = screen.getByText("admin.account.changePasswordButton");
      await act(async () => {
        fireEvent.click(changeButton);
      });

      expect(screen.getByRole("alert").textContent).toBe("admin.account.passwordMinLength");
    });

    it("shows server error on change failure", async () => {
      const fetchMock = mockFetch([
        { ok: true, body: admins },
        { ok: false, status: 400, body: { error: "Current password is incorrect" } },
      ]);
      vi.stubGlobal("fetch", fetchMock);

      await act(async () => {
        render(<AdminAccount />);
      });

      const currentPwInput = screen.getByLabelText("admin.account.currentPassword");
      const newPwInput = screen.getByLabelText("admin.account.newPassword");

      fireEvent.change(currentPwInput, { target: { value: "wrongpassword" } });
      fireEvent.change(newPwInput, { target: { value: "newpassword123" } });

      const changeButton = screen.getByText("admin.account.changePasswordButton");
      await act(async () => {
        fireEvent.click(changeButton);
      });

      expect(screen.getByRole("alert").textContent).toBe("Current password is incorrect");
    });
  });
});
