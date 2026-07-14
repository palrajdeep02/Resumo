import { test, expect } from "@playwright/test";

test("Full User Flow E2E Integration (Register -> Login -> Profile -> App Creation -> AI Scoring)", async ({ page }) => {
  // Generate unique credentials to avoid duplicate database keys
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const email = `testuser_${randomSuffix}@example.com`;
  const password = "Password123!";

  // 1. Register User
  await page.goto("/register");
  await page.fill('input[name="name"]', "E2E Test User");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Verify register redirects to login
  await page.waitForURL("**/login");

  // 2. Login User
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Verify login redirects to dashboard
  await page.waitForURL("**/dashboard");

  // 3. Create Profile details
  await page.goto("/profile");
  await page.fill('textarea[name="baseResumeText"]', "Experienced frontend engineer skilled in React and TypeScript.");
  await page.fill('input[name="skills"]', "React, TypeScript, Vitest, Playwright");
  await page.fill('input[name="experienceYears"]', "5");
  await page.fill('input[name="targetRoles"]', "Senior Frontend Engineer");
  await page.click('button[type="submit"]');

  // Verify successful profile save banner is displayed
  await expect(page.locator("text=Profile updated successfully")).toBeVisible();

  // 4. Create Job Application
  await page.goto("/applications/new");
  await page.fill('input[name="company"]', "Google DeepMind");
  await page.fill('input[name="jobTitle"]', "Software Engineer (Agentic AI)");
  await page.fill('textarea[name="jobDescriptionText"]', "We are building advanced AI coding assistants. Requirements: React, TypeScript, Vitest, Playwright, LLM integration.");
  await page.click('button[type="submit"]');

  // Verify application creation redirects to detail page
  await page.waitForURL("**/applications/*");

  // 5. Mock AI match score API call to prevent external API calls and token waste
  await page.route("**/api/ai/score", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          overall_score: 85,
          matched_skills: ["React", "TypeScript", "Vitest", "Playwright"],
          missing_skills: ["LLM integration"],
          strengths: ["Strong frontend foundations", "Experienced with testing"],
          recommendations: ["Build a small project using LLM APIs"]
        }
      })
    });
  });

  // Verify compatibility card is not yet visible before trigger
  await expect(page.locator("text=Match Quality Evaluation")).not.toBeVisible();

  // 6. Run Match Score evaluation
  await page.click('button:has-text("Analyze Match")');

  // Wait for the evaluation to process and render results in the card
  await expect(page.locator("text=Match Quality Evaluation")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("text=Overall Compatibility Level")).toBeVisible();
  await expect(page.locator("text=Key Strengths")).toBeVisible();
  await expect(page.locator("text=Identified Skill Gaps")).toBeVisible();
});
