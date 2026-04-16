import { expect, type APIRequestContext, type APIResponse, type Page } from "@playwright/test"

const BACKEND_URL = process.env.PLAYWRIGHT_BACKEND_URL || "http://127.0.0.1:8000/api/v1"

type AuthPayload = {
  access: string
  refresh: string
}

async function readJson(response: APIResponse) {
  expect(response.ok()).toBeTruthy()
  return response.json()
}

export async function apiLogin(request: APIRequestContext, email: string, password: string): Promise<AuthPayload> {
  const response = await request.post(`${BACKEND_URL}/auth/login/`, {
    data: { email, password },
  })
  const payload = await readJson(response)
  return payload.data as AuthPayload
}

export async function getApprovedTherapistId(request: APIRequestContext) {
  const response = await request.get(`${BACKEND_URL}/therapists/profiles/`)
  const payload = await readJson(response)
  return String(payload.data.results[0].id)
}

export async function createTherapistAvailability(request: APIRequestContext) {
  const therapistSession = await apiLogin(request, "therapist@manochittasathi.com", "Therapist@123")
  const start = new Date(Date.now() + 48 * 60 * 60 * 1000)
  start.setMinutes(0, 0, 0)
  start.setHours(10, 0, 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const response = await request.post(`${BACKEND_URL}/therapists/availability/`, {
    headers: { Authorization: `Bearer ${therapistSession.access}` },
    data: {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    },
  })
  const payload = await readJson(response)
  return {
    id: String(payload.data.id),
    startTime: String(payload.data.start_time),
  }
}

export async function createCompletedAppointment(request: APIRequestContext) {
  const therapistId = await getApprovedTherapistId(request)
  const availability = await createTherapistAvailability(request)
  const userSession = await apiLogin(request, "user@manochittasathi.com", "User@12345")
  const therapistSession = await apiLogin(request, "therapist@manochittasathi.com", "Therapist@123")

  const createResponse = await request.post(`${BACKEND_URL}/appointments/`, {
    headers: { Authorization: `Bearer ${userSession.access}` },
    data: {
      therapist: therapistId,
      availability_slot: availability.id,
      session_type: "video",
    },
  })
  const createPayload = await readJson(createResponse)
  const appointmentId = String(createPayload.data.id)

  await readJson(
    await request.post(`${BACKEND_URL}/appointments/${appointmentId}/accept/`, {
      headers: { Authorization: `Bearer ${therapistSession.access}` },
      data: {},
    })
  )

  await readJson(
    await request.post(`${BACKEND_URL}/appointments/${appointmentId}/complete/`, {
      headers: { Authorization: `Bearer ${therapistSession.access}` },
      data: {},
    })
  )

  return appointmentId
}

export async function createPendingTherapist(request: APIRequestContext) {
  const timestamp = Date.now()
  const email = `pending-therapist-${timestamp}@example.com`
  const password = "PendingPass123!"
  const firstName = `Pending${timestamp}`

  const response = await request.post(`${BACKEND_URL}/auth/register/`, {
    data: {
      email,
      first_name: firstName,
      last_name: "Therapist",
      password,
      role: "therapist",
    },
  })
  expect(response.ok()).toBeTruthy()
  return {
    email,
    password,
    firstName,
  }
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/^password$/i).fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()
}
