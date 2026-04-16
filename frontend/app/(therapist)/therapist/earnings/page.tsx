"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TherapistEarningsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">This screen is currently unavailable.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Not Available Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Earnings and payout reporting are not supported by the current backend API, so the previous mock view has
            been removed from the active therapist experience.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
