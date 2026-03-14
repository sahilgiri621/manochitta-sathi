import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Phone, Video, Users, Heart, Brain, Sparkles, Shield, Clock, BadgeCheck } from "lucide-react"
import Link from "next/link"

const therapyTypes = [
  {
    icon: Brain,
    title: "Individual Therapy",
    description: "One-on-one sessions with a licensed therapist to address personal challenges, mental health concerns, and life transitions.",
    features: ["Anxiety & Depression", "Stress Management", "Trauma & PTSD", "Self-esteem Issues"],
    price: "From NPR 1,500 per session"
  },
  {
    icon: Users,
    title: "Couples Therapy",
    description: "Work with a specialized couples therapist to improve communication, resolve conflicts, and strengthen your relationship.",
    features: ["Communication Skills", "Conflict Resolution", "Trust Building", "Intimacy Issues"],
    price: "From NPR 2,500 per session"
  },
  {
    icon: Heart,
    title: "Teen Counseling",
    description: "Age-appropriate therapy for teenagers (13-19) dealing with academic pressure, social challenges, and emotional difficulties.",
    features: ["Academic Stress", "Peer Relationships", "Identity Issues", "Family Conflicts"],
    price: "From NPR 1,500 per session"
  },
  {
    icon: Sparkles,
    title: "Career Counseling",
    description: "Professional guidance to help you navigate career decisions, workplace stress, and professional development.",
    features: ["Career Transitions", "Workplace Stress", "Work-Life Balance", "Professional Growth"],
    price: "From NPR 1,800 per session"
  }
]

const sessionFormats = [
  {
    icon: MessageSquare,
    title: "Text Messaging",
    description: "Send unlimited messages to your therapist and receive thoughtful responses daily. Perfect for those who prefer writing."
  },
  {
    icon: Phone,
    title: "Audio Sessions",
    description: "Schedule phone-style conversations with your therapist through our secure platform. Ideal for those who prefer voice communication."
  },
  {
    icon: Video,
    title: "Video Sessions",
    description: "Face-to-face video calls that provide the closest experience to in-person therapy. Best for comprehensive sessions."
  }
]

const benefits = [
  {
    icon: Shield,
    title: "100% Confidential",
    description: "All communications are encrypted and protected by strict privacy policies."
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description: "Book sessions at times that work for you, including evenings and weekends."
  },
  {
    icon: BadgeCheck,
    title: "Licensed Professionals",
    description: "All therapists are verified, licensed, and have years of clinical experience."
  }
]

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4 text-balance">
            Our Services
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto text-pretty">
            Professional mental health support tailored to your needs, accessible anytime, anywhere.
          </p>
        </div>
      </section>

      {/* Therapy Types */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Types of Therapy
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the type of therapy that best fits your situation and goals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {therapyTypes.map((therapy, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <therapy.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{therapy.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {therapy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {therapy.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <p className="text-primary font-semibold">{therapy.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Session Formats */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              How You Can Connect
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Multiple ways to communicate with your therapist based on your comfort level.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {sessionFormats.map((format, index) => (
              <Card key={index} className="border-border text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <format.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-foreground">{format.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{format.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Mannochitta Sathi
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Affordable therapy options with no hidden fees. Pay per session or subscribe for better rates.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-foreground">Pay Per Session</CardTitle>
                <div className="text-3xl font-bold text-primary mt-2">NPR 1,500 - NPR 3,000</div>
                <CardDescription>per session</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>No commitment required</li>
                  <li>Choose any available therapist</li>
                  <li>Flexible scheduling</li>
                  <li>All session formats available</li>
                </ul>
                <Link href="/therapists">
                  <Button variant="outline" className="rounded-full">
                    Browse Therapists
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-primary border-2">
              <CardHeader className="text-center">
                <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Most Popular</div>
                <CardTitle className="text-xl text-foreground">Monthly Subscription</CardTitle>
                <div className="text-3xl font-bold text-primary mt-2">NPR 4,999</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>4 live sessions per month</li>
                  <li>Unlimited messaging</li>
                  <li>Priority scheduling</li>
                  <li>Save up to 20%</li>
                </ul>
                <Link href="/therapists">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
            Start Your Journey Today
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-xl mx-auto">
            Take the first step towards better mental health. Get matched with a therapist in under 48 hours.
          </p>
          <Link href="/therapists">
            <Button variant="secondary" size="lg" className="rounded-full px-8">
              Find Your Therapist
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
