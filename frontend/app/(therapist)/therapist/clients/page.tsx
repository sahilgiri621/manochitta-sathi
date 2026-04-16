"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TherapistClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-muted-foreground">This screen is currently unavailable.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Not Available Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The backend does not yet provide a therapist client-management module beyond appointments and conversations,
            so this mock screen has been intentionally disabled.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
