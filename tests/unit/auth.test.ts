import { describe, it, expect, vi } from "vitest";
import { verifyResourceOwner } from "../../lib/auth";
import { auth } from "../../auth";

vi.mock("../../auth", () => ({
  auth: vi.fn(),
}));

describe("verifyResourceOwner Helper", () => {
  it("should return the userId if the authenticated user is the resource owner", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-123" },
      expires: "2026-07-14",
    });

    const result = await verifyResourceOwner("user-123");
    expect(result.userId).toBe("user-123");
    expect(result.response).toBeUndefined();
  });

  it("should return a 401 response if the user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await verifyResourceOwner("user-123");
    expect(result.userId).toBeUndefined();
    expect(result.response).toBeDefined();
    expect(result.response?.status).toBe(401);
  });

  it("should return a 403 response if the user is mismatched", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-456" },
      expires: "2026-07-14",
    });

    const result = await verifyResourceOwner("user-123");
    expect(result.userId).toBeUndefined();
    expect(result.response).toBeDefined();
    expect(result.response?.status).toBe(403);
  });
});
