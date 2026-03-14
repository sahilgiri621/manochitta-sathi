import { Button } from "@/components/ui/button"
import { Gift } from "lucide-react"

export function GiftSection() {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-lg">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Give the gift of a Mannochitta Sathi membership
              </h2>
              <p className="text-muted-foreground mb-6">
                Therapy is one of the most meaningful gifts you can give to
                your friends and loved ones.
              </p>
              <Button
                variant="outline"
                className="rounded-full border-foreground text-foreground hover:bg-foreground hover:text-background"
              >
                <Gift className="h-4 w-4 mr-2" />
                Gift a membership
              </Button>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div className="w-48 h-48 bg-accent/30 rounded-full flex items-center justify-center">
                  <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center">
                    <Gift className="h-16 w-16 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
