import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../app/api/ai/score/route";
import { db } from "../../db";
import { generateObject } from "ai";
import { getCurrentUser } from "../../lib/auth";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("../../lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogle: vi.fn(() => vi.fn()),
}));

describe("POST /api/ai/score API Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_API_KEY = "test-api-key";
  });

  it("should return 401 if user is unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/ai/score", {
      method: "POST",
      body: JSON.stringify({ applicationId: "d3b07384-d113-4956-a5cc-be75c4b4d782" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 400 if request body is invalid", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce("user-123");

    const request = new Request("http://localhost/api/ai/score", {
      method: "POST",
      body: JSON.stringify({}), // missing applicationId
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("Invalid request parameters");
  });

  it("should run match scoring logic successfully if data is valid", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue("user-123");

    // Mock DB queries
    // 1. Fetch application details
    const appMock = [{ id: "app-123", userId: "user-123", jobDescriptionText: "React Node" }];
    const selectAppChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(appMock),
    };

    // 2. Fetch profile details
    const profileMock = [{ id: "profile-123", userId: "user-123", baseResumeText: "Resume bullets", skills: ["React"] }];
    const selectProfileChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(profileMock),
    };

    // 3. Fetch match scores check (existing check)
    const scoreCheckMock: any[] = [];
    const selectScoreCheckChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(scoreCheckMock),
    };

    vi.mocked(db.select)
      .mockReturnValueOnce(selectAppChain as any)
      .mockReturnValueOnce(selectProfileChain as any)
      .mockReturnValueOnce(selectScoreCheckChain as any);

    // Mock database inserts
    const insertMock = {
      values: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(db.insert).mockReturnValue(insertMock as any);

    // Mock Vercel AI SDK generateObject
    const mockAIResponse = {
      object: {
        overall_score: 85,
        matched_skills: ["React"],
        missing_skills: ["Node.js"],
        strengths: ["Good react knowledge"],
        recommendations: ["Learn Node.js"],
      },
    };
    vi.mocked(generateObject).mockResolvedValueOnce(mockAIResponse as any);

    const request = new Request("http://localhost/api/ai/score", {
      method: "POST",
      body: JSON.stringify({ applicationId: "d3b07384-d113-4956-a5cc-be75c4b4d782" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.overall_score).toBe(85);
  });
});
