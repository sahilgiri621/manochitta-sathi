"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { authService } from "@/services/auth-service"

function VerifyEmailPageContent() {
  const searchParams = useSearchParams()
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const email = searchParams.get("email") || ""

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) return
    setIsVerifying(true)
    authService
      .verifyEmail(token)
      .then(() => {
        toast.success("Email verified successfully. You can sign in now.")
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Email verification failed.")
      })
      .finally(() => setIsVerifying(false))
  }, [searchParams])

  const handleResend = async () => {
    if (!email) {
      toast.error("Email address is missing.")
      return
    }
    setIsResending(true)
    try {
      await authService.resendVerification(email)
      toast.success("Verification email sent!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-accent rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Verify your email</h2>
        <p className="text-muted-foreground mb-6">
          {isVerifying
            ? "Verifying your email address..."
            : "We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to verify your account."}
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            disabled={isResending}
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Already verified?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-md" />}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}
