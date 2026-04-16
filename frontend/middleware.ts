import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const AUTH_ACCESS_COOKIE = "ms_auth_access"
const AUTH_ROLE_COOKIE = "ms_auth_role"
const AUTH_ROUTES = new Set(["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"])

function matchesRouteSegment(pathname: string, segment: string) {
  return pathname === segment || pathname.startsWith(`${segment}/`)
}

function defaultRouteForRole(role: string | undefined) {
  if (role === "admin") return "/admin"
  if (role === "therapist") return "/therapist"
  return "/dashboard"
}

function supportRouteForRole(role: string | undefined) {
  if (role === "admin") return "/admin/support"
  if (role === "user") return "/support"
  return defaultRouteForRole(role)
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const access = request.cookies.get(AUTH_ACCESS_COOKIE)?.value
  const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value

  if (AUTH_ROUTES.has(pathname) && access && role) {
    return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url))
  }

  const isAdminRoute = matchesRouteSegment(pathname, "/admin")
  const isTherapistRoute = matchesRouteSegment(pathname, "/therapist")
  const isUserRoute = matchesRouteSegment(pathname, "/dashboard")
  const isSupportRoute = matchesRouteSegment(pathname, "/support")

  if ((isAdminRoute || isTherapistRoute || isUserRoute || isSupportRoute) && !access) {
    const next = `${pathname}${search}`
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url))
  }

  if (access && role) {
    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url))
    }
    if (isTherapistRoute && role !== "therapist") {
      return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url))
    }
    if (isUserRoute && role !== "user") {
      return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url))
    }
    if (isSupportRoute && role !== "user") {
      return NextResponse.redirect(new URL(supportRouteForRole(role), request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/dashboard/:path*", "/therapist/:path*", "/admin/:path*", "/support/:path*"],
}
