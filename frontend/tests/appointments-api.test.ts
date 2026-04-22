import { api } from "@/lib/api"

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

describe("appointments API", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("can load every appointment page for dashboard totals", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          count: 2,
          next: "http://localhost:8000/api/v1/appointments/?page=2&page_size=100",
          previous: null,
          results: [{ id: "appointment-1", status: "confirmed" }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          count: 2,
          next: null,
          previous: "http://localhost:8000/api/v1/appointments/?page_size=100",
          results: [{ id: "appointment-2", status: "cancelled" }],
        }),
      )

    vi.stubGlobal("fetch", fetchMock)

    const appointments = await api.getAppointments({ allPages: true })

    expect(appointments.map((appointment) => appointment.id)).toEqual([
      "appointment-1",
      "appointment-2",
    ])
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/backend/appointments/?page_size=100",
      expect.any(Object),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/backend/appointments/?page=2&page_size=100",
      expect.any(Object),
    )
  })
})
