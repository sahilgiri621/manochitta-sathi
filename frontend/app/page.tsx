import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  MessageSquare,
  Phone,
  Video,
  Clock,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  User,
  Heart,
  Gift,
} from "lucide-react"
import { faqEntries } from "@/lib/content"
import { FeaturedTherapists } from "@/components/home/featured-therapists"

const stats = [
  { value: "465,674,673", label: "Messages, chat, audio, video sessions" },
  { value: "31,975", label: "Qualified therapists ready to help" },
  { value: "6,297,112", label: "People got help" },
]

const comparisonFeatures = [
  { feature: "24/7 access", mannochitta: true, office: false },
  { feature: "Manageable fees", mannochitta: true, office: false },
  { feature: "Convenient scheduling", mannochitta: true, office: false },
  { feature: "Communicate at your comfort level", mannochitta: true, office: false },
  { feature: "Messaging any time", mannochitta: true, office: false },
  { feature: "Chat sessions", mannochitta: true, office: false },
  { feature: "Phone sessions", mannochitta: true, office: false },
  { feature: "Video sessions", mannochitta: true, office: true },
  { feature: "Easy scheduling", mannochitta: true, office: false },
  { feature: "Digital worksheets", mannochitta: true, office: false },
  { feature: "Group sessions", mannochitta: true, office: true },
  { feature: "Smart provider matching", mannochitta: true, office: false },
  { feature: "Easy to switch providers", mannochitta: true, office: false },
  { feature: "Access from anywhere", mannochitta: true, office: false },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 text-balance">
            You deserve to be happy.
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
            What type of therapy are you looking for?
          </p>

          {/* Therapy Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link href="/register?type=individual">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Individual</h3>
                  <p className="text-sm text-muted-foreground">For myself</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/register?type=couples">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Couples</h3>
                  <p className="text-sm text-muted-foreground">For me and my partner</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/register?type=teen">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Teen</h3>
                  <p className="text-sm text-muted-foreground">For my child</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            The world&apos;s largest therapy service.
          </h2>
          <p className="text-lg text-primary mb-12">100% online.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index}>
                <p className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Therapists Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Professional and qualified therapists who you can trust
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Tap into Nepal&apos;s largest network of qualified and experienced therapists who can
              help you with a range of issues including depression, anxiety, relationships,
              trauma, grief, and more.
            </p>
          </div>

          <FeaturedTherapists />
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Text Messaging</h3>
              <p className="text-sm text-muted-foreground">
                Send unlimited messages to your therapist and receive thoughtful responses daily.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Audio Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Schedule phone-style conversations with your therapist through our secure platform.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Video Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Face-to-face video calls that provide the closest experience to in-person therapy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Why choose Mannochitta Sathi?
          </h2>

          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-4 text-center font-semibold">
              <div></div>
              <div className="text-primary">Mannochitta Sathi</div>
              <div className="text-muted-foreground">In-office</div>
            </div>
            {comparisonFeatures.slice(0, 8).map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 py-3 border-b border-border items-center"
              >
                <div className="text-sm text-foreground">{item.feature}</div>
                <div className="text-center">
                  {item.mannochitta ? (
                    <CheckCircle2 className="w-5 h-5 text-primary mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                  )}
                </div>
                <div className="text-center">
                  {item.office ? (
                    <CheckCircle2 className="w-5 h-5 text-primary mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Frequently asked questions
          </h2>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {faqEntries.slice(0, 8).map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="bg-background border border-border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="text-foreground font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/faq">More frequently asked questions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Gift Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <Gift className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Give the gift of a Mannochitta Sathi membership
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Therapy is one of the most meaningful gifts you can give to your friends and loved ones.
          </p>
          <Button variant="secondary" size="lg">
            Gift a membership
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Take the first step towards better mental health. Get matched with a therapist in under 48 hours.
          </p>
          <Button asChild size="lg">
            <Link href="/register">Get matched with a therapist</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
