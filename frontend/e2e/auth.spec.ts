import { expect, test } from "@playwright/test"
import { loginViaUi } from "./helpers"

test("user can register and then log back in", async ({ page }) => {
  const timestamp = Date.now()
  const email = `release-user-${timestamp}@example.com`
  const password = "ReleasePass123!"

  await page.goto("/register")
  await page.getByLabel(/full name/i).fill("Release User")
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/^password$/i).fill(password)
  await page.getByLabel(/confirm password/i).fill(password)
  await page.getByRole("button", { name: /create account/i }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible()

  await page.getByRole("button", { name: /log out/i }).click()
  await expect(page).toHaveURL(/\/login$/)

  await loginViaUi(page, email, password)
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible()
})
