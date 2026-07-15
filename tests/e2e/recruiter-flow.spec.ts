import { test, expect } from "@playwright/test"

test.describe("Recruiter E2E Flow", () => {
  test("should navigate to signup, fill recruiter company creation fields, and redirect to login", async ({ page }) => {
    // Go to login page
    await page.goto("/login")
    await expect(page).toHaveTitle(/Resumo/)

    // Click signup link
    await page.click("text=Sign Up")
    await page.waitForURL("**/signup")

    // Input fields
    const uniqueEmail = `recruiter-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`
    await page.fill('input[placeholder="John Doe"]', "E2E Recruiter")
    await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
    await page.fill('input[placeholder="••••••••"]', "password123")
    
    // Select Recruiter role
    await page.check('input[value="RECRUITER"]')

    // Confirm that company inputs appear
    await expect(page.locator('input[placeholder="Company Name"]')).toBeVisible()

    // Fill company information
    await page.fill('input[placeholder="Company Name"]', "E2E Labs LLC")
    await page.fill('input[placeholder="https://example.com"]', "https://e2elabs.example.com")
    await page.fill('textarea[placeholder="Brief description of the organization..."]', "Doing E2E automation test mocks.")

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to login page with success notification
    await page.waitForURL("**/login")
    await expect(page.locator("text=Account created successfully")).toBeVisible()
  })
})
