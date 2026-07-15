import { test, expect } from "@playwright/test"

test.describe("Candidate E2E Flow", () => {
  test("should navigate to register, perform sign up, and redirect to login page", async ({ page }) => {
    // Go to homepage / login
    await page.goto("/login")
    await expect(page).toHaveTitle(/Resumo/)

    // Go to register page
    await page.click("text=Sign Up")
    await page.waitForURL("**/signup")

    // Fill form inputs
    const uniqueEmail = `candidate-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`
    await page.fill('input[placeholder="John Doe"]', "E2E Candidate")
    await page.fill('input[placeholder="you@example.com"]', uniqueEmail)
    await page.fill('input[placeholder="••••••••"]', "password123")
    
    // Select role
    await page.check('input[value="CANDIDATE"]')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to login page with success notification
    await page.waitForURL("**/login")
    await expect(page.locator("text=Account created successfully")).toBeVisible()
  })
})
