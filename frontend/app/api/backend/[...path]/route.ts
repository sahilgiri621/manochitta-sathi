import type { NextRequest } from "next/server"

import { handleProxy } from "../../_shared/proxy"

export const runtime = "nodejs"

type ProxyContext = { params: Promise<{ path: string[] }> | { path: string[] } }

export function GET(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context)
}

export function POST(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context)
}

export function PUT(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context)
}

export function PATCH(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context)
}

export function DELETE(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context)
}

export function OPTIONS(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context)
}

export function HEAD(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context)
}
