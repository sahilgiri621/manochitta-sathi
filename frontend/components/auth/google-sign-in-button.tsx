"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { getSafeRedirectPath } from "@/lib/routing"
import type { User } from "@/lib/types"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: Record<string, unknown>) => void
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
          cancel: () => void
        }
      }
    }
  }
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client"

function getGoogleClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ""
}

function defaultRouteForRole(role: User["role"]) {
  if (role === "admin") return "/admin"
  if (role === "therapist") return "/therapist"
  return "/dashboard"
}

function loadGoogleScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Google sign-in is only available in the browser."))
  if (window.google?.accounts?.id) return Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in.")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google sign-in."))
    document.head.appendChild(script)
  })
}

interface GoogleSignInButtonProps {
  mode: "login" | "register"
  nextPath?: string | null
}

export function GoogleSignInButton({ mode, nextPath }: GoogleSignInButtonProps) {
  const router = useRouter()
  const { googleLogin } = useAuth()
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const googleClientId = getGoogleClientId()

  const successMessage = useMemo(
    () => (mode === "register" ? "Account created with Google." : "Signed in with Google."),
    [mode]
  )

  useEffect(() => {
    if (!googleClientId) {
      setLoadError("Google sign-in is not configured for this environment.")
      return
    }

    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          ux_mode: "popup",
          context: mode === "register" ? "signup" : "signin",
          callback: async (response: { credential?: string }) => {
            if (!response.credential) {
              toast.error("Google did not return a credential.")
              return
            }

            setIsSubmitting(true)
            try {
              const user = await googleLogin(response.credential)
              toast.success(successMessage)
              router.push(getSafeRedirectPath(nextPath, defaultRouteForRole(user.role)))
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Google sign-in failed.")
            } finally {
              setIsSubmitting(false)
            }
          },
        })

        buttonRef.current.innerHTML = ""
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: mode === "register" ? "signup_with" : "continue_with",
          width: Math.min(buttonRef.current.clientWidth || 360, 360),
          logo_alignment: "left",
        })
        setIsReady(true)
        setLoadError(null)
      })
      .catch((error) => {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : "Failed to load Google sign-in.")
      })

    return () => {
      cancelled = true
      window.google?.accounts?.id?.cancel?.()
    }
  }, [googleClientId, googleLogin, mode, nextPath, router, successMessage])

  if (!googleClientId) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Google sign-in is unavailable until `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div
        ref={buttonRef}
        className="flex min-h-11 w-full items-center justify-center"
        aria-hidden={isSubmitting || !isReady}
      />
      {(isSubmitting || (!isReady && !loadError)) && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing Google sign-in...
        </div>
      )}
      {loadError ? <p className="text-center text-xs text-destructive">{loadError}</p> : null}
    </div>
  )
}
