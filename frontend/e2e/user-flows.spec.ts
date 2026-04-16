import { expect, test } from "@playwright/test"
import { createCompletedAppointment, createTherapistAvailability, loginViaUi } from "./helpers"

test("user can book a therapist slot and log a mood entry", async ({ page, request }) => {
  await createTherapistAvailability(request)

  await loginViaUi(page, "user@manochittasathi.com", "User@12345")
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto("/therapists")
  await page.getByRole("link", { name: /asha shrestha/i }).first().click()
  await page.locator("button").filter({ hasText: ":" }).first().click()
  await page.getByRole("button", { name: /book appointment/i }).click()

  await page.goto("/dashboard/appointments")
  await expect(page.getByText(/asha shrestha/i).first()).toBeVisible()

  await page.goto("/dashboard/mood")
  await page.getByRole("button", { name: /happy/i }).click()
  await page.getByLabel(/stress level/i).fill("2")
  await page.getByLabel(/energy level/i).fill("4")
  await page.getByLabel(/notes/i).fill("Playwright mood entry")
  await page.getByRole("button", { name: /save entry/i }).click()

  await expect(page.getByText(/Playwright mood entry/i)).toBeVisible()
})

test("user can submit feedback for a completed appointment", async ({ page, request }) => {
  await createCompletedAppointment(request)

  await loginViaUi(page, "user@manochittasathi.com", "User@12345")
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto("/dashboard/feedback")
  await page.getByLabel(/completed appointment/i).selectOption({ index: 1 })
  await page.getByLabel(/rating/i).fill("5")
  await page.getByLabel(/comment/i).fill("Playwright feedback entry")
  await page.getByRole("button", { name: /submit feedback/i }).click()

  await expect(page.getByText(/Playwright feedback entry/i)).toBeVisible()
})
