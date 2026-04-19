import Link from "next/link"
import { AlertTriangle, PhoneCall, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CrisisSupportBannerProps {
  compact?: boolean
  showSupportLink?: boolean
}

const helplines = [
  { label: "1166", href: "tel:1166", description: "National Suicide Prevention Helpline" },
  { label: "100", href: "tel:100", description: "24-hour emergency hotline" },
  { label: "112", href: "tel:112", description: "24-hour emergency hotline" },
]

export function CrisisSupportBanner({ compact = false, showSupportLink = false }: CrisisSupportBannerProps) {
  return (
    <section
      aria-labelledby={compact ? "homepage-immediate-support" : "immediate-support"}
      className="bg-[#0f5f2c] text-white"
    >
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                  Crisis support
                </p>
                <h2
                  id={compact ? "homepage-immediate-support" : "immediate-support"}
                  className="text-2xl font-bold tracking-tight md:text-3xl"
                >
                  {compact ? "Immediate Support" : "Need Immediate Support?"}
                </h2>
                <p className="max-w-4xl text-base leading-7 text-white/95 md:text-lg">
                  {compact
                    ? "If you need urgent emotional support in Nepal, contact 1166, 100, or 112."
                    : "For immediate emotional support or suicide prevention in Nepal, you can contact the National Suicide Prevention Helpline at 1166, available daily from 8:00 AM to 8:00 PM, or 24-hour emergency hotlines at 100 and 112."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {helplines.map((line) => (
                <a
                  key={line.label}
                  href={line.href}
                  className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 p-4 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <PhoneCall className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-xl font-bold leading-none">{line.label}</span>
                    <span className="mt-1 block text-sm text-white/85">{line.description}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          {showSupportLink ? (
            <div className="flex flex-col gap-3 rounded-lg border border-white/20 bg-white/10 p-5 lg:min-w-64">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                Get help now
              </div>
              <p className="text-sm leading-6 text-white/85">
                View crisis numbers and support options in one place.
              </p>
              <Button asChild variant="secondary" className="rounded-md">
                <Link href="/support">View all helplines</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
