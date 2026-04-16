import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, HeartHandshake, Sparkles } from "lucide-react"

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-primary-foreground">Careers</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
            Join Manochitta Sathi and help us build more accessible, trusted mental health support for people across Nepal.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Join Our Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We are growing a platform focused on compassionate care, better access to therapy, and a smoother experience for both clients and mental health professionals.
              </p>
              <p>
                If you want to be part of Manochitta Sathi, explore the therapist onboarding flow, connect with our team, and stay in touch for future collaboration opportunities.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/for-therapists">Join as a Therapist</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Talk to Our Team</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-primary" />
                Therapists Can Apply
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Licensed therapists can apply to join the platform through our therapist application flow and go through profile review, approval, and onboarding.
              </p>
              <p>
                This is the best place to start if you want to offer sessions, build your presence on the platform, and support clients through Manochitta Sathi.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/for-therapists">Apply as a Therapist</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/therapists">Browse Therapists</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-border bg-card py-16">
        <div className="container mx-auto px-4 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-2xl font-bold text-foreground">Want to work with us?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            For partnerships, therapist onboarding, collaborations, or future hiring conversations, contact our team and we will guide you to the right next step.
          </p>
          <Button asChild className="mt-6">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
