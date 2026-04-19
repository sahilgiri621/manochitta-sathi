"use client"

import { useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import type { PlatformStats } from "@/lib/types"

const fallbackStats: PlatformStats = {
  sessionsCompleted: 0,
  therapistsAvailable: 0,
  peopleHelped: 0,
  communityMembers: 0,
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function PlatformStatsSection() {
  const [stats, setStats] = useState<PlatformStats>(fallbackStats)

  useEffect(() => {
    let cancelled = false

    api
      .getPlatformStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(fallbackStats)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(
    () => [
      { value: stats.sessionsCompleted, label: "Completed therapy sessions" },
      { value: stats.therapistsAvailable, label: "Approved therapists ready to help" },
      { value: stats.communityMembers, label: "Community members" },
    ],
    [stats]
  )

  return (
    <section className="py-16 bg-card">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Real support from qualified therapists.
        </h2>
        <p className="text-lg text-primary mb-12">100% online.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {items.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {formatCount(stat.value)}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
