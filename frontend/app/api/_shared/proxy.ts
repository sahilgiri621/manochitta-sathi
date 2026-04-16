import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

function getBackendApiBaseUrl() {
  const value = process.env.BACKEND_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!value) {
    throw new Error("BACKEND_API_URL or NEXT_PUBLIC_API_URL must be configured for the frontend proxy.")
  }
  return value.replace(/\/$/, "")
}

export async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const { path } = await context.params
  const normalizedPath = path.join("/")
  const upstreamPath = normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`
  const upstreamUrl = new URL(`${getBackendApiBaseUrl()}/${upstreamPath}`)
  upstreamUrl.search = request.nextUrl.search

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")

  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    })

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown connection error while contacting the backend API."

    return NextResponse.json(
      {
        success: false,
        message: `Unable to reach backend API at ${upstreamUrl.origin}. Check that Django is running and BACKEND_API_URL points to the active backend. ${message}`,
      },
      { status: 503 }
    )
  }
}
