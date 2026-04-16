"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { resourceService } from "@/services"
import type { Resource, ResourceCategory } from "@/lib/types"

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<ResourceCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([resourceService.list(), resourceService.listCategories()])
      .then(([resourceData, categoryData]) => {
        setResources(resourceData)
        setCategories(categoryData)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const filteredResources = resources.filter((resource) => {
    const matchesCategory = selectedCategory === "all" || resource.categoryId === selectedCategory || resource.category === selectedCategory
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      resource.title.toLowerCase().includes(query) || (resource.summary || "").toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Resources</h1>
          <p className="text-muted-foreground">Browse published mental health content from the backend.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10" placeholder="Search resources" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={selectedCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("all")}>
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id || selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">Loading resources...</div>
        ) : filteredResources.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No resources found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Link key={resource.id} href={`/resources/${resource.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <Badge variant="secondary" className="mb-3">{resource.category || "Resource"}</Badge>
                    <h2 className="text-lg font-semibold mb-2">{resource.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-3">{resource.summary || resource.description || ""}</p>
                    <p className="text-xs text-muted-foreground mt-4">{resource.readTime} min read</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
