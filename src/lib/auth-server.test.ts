import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  verifySessionCookie: vi.fn(),
  getUser: vi.fn(),
  getUserDoc: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("./firebase/admin", () => ({
  adminAuth: {
    verifySessionCookie: mocks.verifySessionCookie,
    getUser: mocks.getUser,
  },
  adminDb: {
    collection: () => ({
      doc: () => ({ get: mocks.getUserDoc }),
    }),
  },
}));

import { getCurrentUser } from "./auth-server";

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.cookies.mockResolvedValue({
      get: vi.fn(() => ({ value: "session-cookie" })),
    });
    mocks.verifySessionCookie.mockResolvedValue({ uid: "user-1" });
    mocks.getUser.mockResolvedValue({
      email: "user@example.com",
      emailVerified: true,
      displayName: "Vera User",
      providerData: [{ providerId: "password" }],
    });
    mocks.getUserDoc.mockResolvedValue({
      exists: true,
      id: "user-1",
      data: () => ({ first_name: "Vera" }),
    });
  });

  it("returns null when no session cookie exists", async () => {
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.verifySessionCookie).not.toHaveBeenCalled();
  });

  it.each([
    "auth/session-cookie-expired",
    "auth/session-cookie-revoked",
  ])("returns null for %s", async (code) => {
    mocks.verifySessionCookie.mockRejectedValue({ code });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("preserves the session when Firebase verification fails temporarily", async () => {
    const failure = Object.assign(new Error("Firebase unavailable"), {
      code: "auth/internal-error",
    });
    mocks.verifySessionCookie.mockRejectedValue(failure);

    await expect(getCurrentUser()).rejects.toBe(failure);
  });

  it("preserves the session when the Firestore profile lookup fails", async () => {
    const failure = new Error("Firestore unavailable");
    mocks.getUserDoc.mockRejectedValue(failure);

    await expect(getCurrentUser()).rejects.toBe(failure);
  });

  it("returns the authenticated user when all checks succeed", async () => {
    await expect(getCurrentUser()).resolves.toMatchObject({
      uid: "user-1",
      email: "user@example.com",
      emailVerified: true,
      dbUser: { id: "user-1", first_name: "Vera" },
      providerIds: ["password"],
    });
  });
});
