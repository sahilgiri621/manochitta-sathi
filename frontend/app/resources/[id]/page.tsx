"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { resourceService } from "@/services"
import type { Resource } from "@/lib/types"

export default function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [resource, setResource] = useState<Resource | null>(null)
  const [related, setRelated] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([resourceService.getById(id), resourceService.list()])
      .then(([resourceData, resourceList]) => {
        setResource(resourceData)
        setRelated(resourceList.filter((item) => item.id !== id).slice(0, 3))
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load resource.")
      })
      .finally(() => setIsLoading(false))
  }, [id])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/resources" className="text-sm text-muted-foreground hover:text-foreground">
          Back to resources
        </Link>

        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">Loading resource...</div>
        ) : !resource ? (
          <div className="py-16 text-center text-muted-foreground">{error || "Resource not found."}</div>
        ) : (
          <>
            <Badge variant="secondary" className="mt-4 mb-4">{resource.category || "Resource"}</Badge>
            <h1 className="text-4xl font-bold mb-4">{resource.title}</h1>
            <p className="text-muted-foreground mb-6">{resource.summary}</p>
            <div className="prose max-w-none whitespace-pre-wrap">{resource.content}</div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Related resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((item) => (
                  <Link key={item.id} href={`/resources/${item.id}`}>
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-2">{item.summary}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <Button asChild>
                <Link href="/therapists">Find a Therapist</Link>
              </Button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
