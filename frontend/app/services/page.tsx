"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/auth-provider"
import { packageService } from "@/services"
import type { PackagePlan, UserSubscription } from "@/lib/types"
import {
  User,
  Users,
  Heart,
  Briefcase,
  MessageSquare,
  Phone,
  Video,
  Shield,
  Clock,
  Award,
  Check,
} from "lucide-react"

const therapyTypes = [
  {
    icon: User,
    title: "Individual Therapy",
    description:
      "One-on-one sessions with a licensed therapist to address personal challenges, mental health concerns, and life transitions.",
    features: [
      "Anxiety & Depression",
      "Stress Management",
      "Trauma & PTSD",
      "Self-esteem Issues",
    ],
    price: "From NPR 1,500 per session",
  },
  {
    icon: Users,
    title: "Couples Therapy",
    description:
      "Work with a specialized couples therapist to improve communication, resolve conflicts, and strengthen your relationship.",
    features: [
      "Communication Skills",
      "Conflict Resolution",
      "Trust Building",
      "Intimacy Issues",
    ],
    price: "From NPR 2,500 per session",
  },
  {
    icon: Heart,
    title: "Teen Counseling",
    description:
      "Age-appropriate therapy for teenagers (13-19) dealing with academic pressure, social challenges, and emotional difficulties.",
    features: [
      "Academic Stress",
      "Peer Relationships",
      "Identity Issues",
      "Family Conflicts",
    ],
    price: "From NPR 1,500 per session",
  },
  {
    icon: Briefcase,
    title: "Career Counseling",
    description:
      "Professional guidance to help you navigate career decisions, workplace stress, and professional development.",
    features: [
      "Career Transitions",
      "Workplace Stress",
      "Work-Life Balance",
      "Professional Growth",
    ],
    price: "From NPR 1,800 per session",
  },
]

const communicationMethods = [
  {
    icon: MessageSquare,
    title: "Text Messaging",
    description:
      "Send unlimited messages to your therapist and receive thoughtful responses daily. Perfect for those who prefer writing.",
  },
  {
    icon: Phone,
    title: "Audio Sessions",
    description:
      "Schedule phone-style conversations with your therapist through our secure platform. Ideal for those who prefer voice communication.",
  },
  {
    icon: Video,
    title: "Video Sessions",
    description:
      "Face-to-face video calls that provide the closest experience to in-person therapy. Best for comprehensive sessions.",
  },
]

const benefits = [
  {
    icon: Shield,
    title: "100% Confidential",
    description:
      "All communications are encrypted and protected by strict privacy policies.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description:
      "Book sessions at times that work for you, including evenings and weekends.",
  },
  {
    icon: Award,
    title: "Licensed Professionals",
    description:
      "All therapists are verified, licensed, and have years of clinical experience.",
  },
]

export default function ServicesPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<PackagePlan[]>([])
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null)
  const [packageError, setPackageError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoadingPlans(true)
    const requests: [Promise<PackagePlan[]>, Promise<UserSubscription[]> | Promise<[]>] = [
      packageService.listPlans(),
      user?.role === "user" ? packageService.listMySubscriptions() : Promise.resolve([]),
    ]
    Promise.all(requests)
      .then(([planData, subscriptionData]) => {
        setPlans(planData)
        setSubscriptions(subscriptionData)
        setPackageError(null)
      })
      .catch((error) => {
        setPackageError(error instanceof Error ? error.message : "Unable to load plans right now.")
      })
      .finally(() => setIsLoadingPlans(false))
  }, [user?.role])

  const activeSubscription = useMemo(
    () =>
      subscriptions.find(
        (subscription) =>
          subscription.status === "active" &&
          subscription.paymentStatus === "paid" &&
          subscription.remainingCredits > 0
      ) || null,
    [subscriptions]
  )

  const handlePurchase = async (planId: string) => {
    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent("/services")}`)
      return
    }
    if (user.role !== "user") {
      setPackageError("Packages can only be purchased from a user account.")
      return
    }
    setBuyingPlanId(planId)
    try {
      const result = await packageService.purchasePlan(planId)
      if (!result.paymentUrl) {
        throw new Error("Plan payment initiation failed.")
      }
      window.location.assign(result.paymentUrl)
    } catch (error) {
      setPackageError(error instanceof Error ? error.message : "Unable to start package payment.")
    } finally {
      setBuyingPlanId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Our Services
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Professional mental health support tailored to your needs, accessible anytime, anywhere.
          </p>
        </div>
      </section>

      {/* Types of Therapy */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Types of Therapy</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the type of therapy that best fits your situation and goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {therapyTypes.map((therapy) => (
              <Card key={therapy.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                      <therapy.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{therapy.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {therapy.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {therapy.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
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

      {/* How You Can Connect */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How You Can Connect</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Multiple ways to communicate with your therapist based on your comfort level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {communicationMethods.map((method) => (
              <Card key={method.title} className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary rounded-xl flex items-center justify-center">
                    <method.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{method.title}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose Mannochitta Sathi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Plans and Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Buy platform-wide plans here, then use your credits later with any approved therapist who has availability.
            </p>
          </div>

          {activeSubscription ? (
            <Card className="max-w-3xl mx-auto mb-8">
              <CardHeader>
                <CardTitle>Your Active Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{activeSubscription.plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  Credits left: {activeSubscription.remainingCredits} / {activeSubscription.totalCredits}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires: {activeSubscription.expiresAt ? new Date(activeSubscription.expiresAt).toLocaleString() : "Not set"}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/therapists">Browse Therapists</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-8">
            {/* Pay Per Session */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Pay Per Session</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">NPR 1,500 - NPR 3,000</span>
                  <p className="text-sm text-muted-foreground mt-1">per session</p>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    No commitment required
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Choose any available therapist
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Flexible scheduling
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    All session formats available
                  </li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/therapists">Browse Therapists</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader className="text-center">
                <CardTitle>Platform-Wide Subscription Plans</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Purchase a plan once in Services, then use the credits later while booking with any approved therapist on the platform.
                </p>
                <p className="text-sm text-muted-foreground">
                  Therapist selection still happens separately during booking.
                </p>
              </CardContent>
            </Card>
          </div>

          {packageError ? (
            <p className="mb-6 text-center text-sm text-destructive">{packageError}</p>
          ) : null}

          {isLoadingPlans ? (
            <p className="text-center text-muted-foreground">Loading subscription plans...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card key={plan.id} className={index === 0 ? "border-primary relative" : ""}>
                  {index === 0 ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">POPULAR PLAN</Badge>
                    </div>
                  ) : null}
                  <CardHeader className="text-center">
                    <CardTitle>{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div>
                      <span className="text-4xl font-bold text-primary">
                        NPR {(plan.priceAmount / 100).toLocaleString()}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        valid for {plan.durationDays} days
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        {plan.sessionCredits} therapist sessions included
                      </li>
                      <li className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Use credits with approved therapists
                      </li>
                      <li className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        Book against real availability only
                      </li>
                    </ul>
                    <Button
                      className="w-full"
                      onClick={() => handlePurchase(plan.id)}
                      disabled={buyingPlanId === plan.id}
                    >
                      {buyingPlanId === plan.id ? "Redirecting..." : "Choose Plan"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Start Your Journey Today
          </h2>
          <p className="text-primary-foreground/90 max-w-xl mx-auto mb-8">
            Take the first step towards better mental health. Get matched with a therapist in under 48 hours.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/therapists">Find Your Therapist</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
