import Link from "next/link"
import { LogoIcon } from "@/components/logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <LogoIcon />
        <span className="text-2xl font-semibold text-foreground">Mannochitta Sathi</span>
      </Link>

      {children}

      <Link
        href="/"
        className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Back to home
      </Link>
    </div>
  )
}
