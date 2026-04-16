import { expect, test } from "@playwright/test"
import { createPendingTherapist, loginViaUi } from "./helpers"

test("admin can approve a pending therapist", async ({ page, request }) => {
  const pendingTherapist = await createPendingTherapist(request)

  await loginViaUi(page, "admin@manochittasathi.com", "Admin@12345")
  await expect(page).toHaveURL(/\/admin$/)

  await page.goto("/admin/therapists")
  await page.getByPlaceholder(/search therapists/i).fill(pendingTherapist.firstName)
  const row = page.locator("div.rounded-lg.border").filter({ hasText: pendingTherapist.firstName }).first()
  await expect(row).toBeVisible()
  await row.getByRole("button", { name: /approve/i }).click()

  await expect(row).toContainText(/approved/i)
})

test("therapist can publish a resource", async ({ page }) => {
  const title = `Playwright Resource ${Date.now()}`

  await loginViaUi(page, "therapist@manochittasathi.com", "Therapist@123")
  await expect(page).toHaveURL(/\/therapist$/)

  await page.goto("/therapist/resources")
  await page.getByLabel(/title/i).fill(title)
  await page.getByLabel(/category/i).selectOption({ label: "Stress Management" })
  await page.getByLabel(/summary/i).fill("Resource published from Playwright.")
  await page.getByLabel(/content/i).fill("Detailed therapist-authored content for automated release testing.")
  await page.getByRole("button", { name: /publish resource/i }).click()

  await expect(page.getByText(title)).toBeVisible()
})
