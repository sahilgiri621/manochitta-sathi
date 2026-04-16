import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Heart,
  Shield,
  Users,
  Globe,
  Award,
  CheckCircle,
} from "lucide-react"

const values = [
  {
    icon: Heart,
    title: "Compassion First",
    description:
      "We believe everyone deserves access to quality mental health support with empathy and understanding.",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description:
      "Your mental health journey is private. We use industry-leading security to protect your information.",
  },
  {
    icon: Users,
    title: "Qualified Professionals",
    description:
      "Every therapist on our platform is verified, licensed, and committed to your well-being.",
  },
  {
    icon: Globe,
    title: "Accessible to All",
    description:
      "We're breaking barriers to mental health care across Nepal with affordable, remote therapy options.",
  },
]

const team = [
  {
    name: "Dr. Suman Sharma",
    role: "Founder & CEO",
    bio: "Clinical psychologist with 15+ years of experience in mental health advocacy.",
  },
  {
    name: "Maya Adhikari",
    role: "Chief Operations Officer",
    bio: "Healthcare administrator dedicated to making mental health services accessible.",
  },
  {
    name: "Rajesh Tamang",
    role: "Chief Technology Officer",
    bio: "Tech leader focused on building secure and user-friendly health platforms.",
  },
  {
    name: "Dr. Anita Gurung",
    role: "Head of Clinical Services",
    bio: "Psychiatrist ensuring the highest standards of care across our platform.",
  },
]

const milestones = [
  { year: "2022", title: "Founded", description: "Mannochitta Sathi was founded with a mission to democratize mental health care" },
  { year: "2023", title: "1,000 Users", description: "Reached our first thousand users seeking mental health support" },
  { year: "2024", title: "50+ Therapists", description: "Grew our network to over 50 qualified mental health professionals" },
  { year: "2025", title: "10,000+ Sessions", description: "Facilitated over 10,000 therapy sessions across Nepal" },
  { year: "2026", title: "Expanding", description: "Continuing to grow and serve more communities in need" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            About Mannochitta Sathi
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-3xl mx-auto">
            We're on a mission to make quality mental health support accessible to everyone in Nepal.
            Through technology and compassion, we connect people with qualified therapists who can help.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                At Mannochitta Sathi, we believe that mental health care should be accessible, 
                affordable, and stigma-free. Our platform connects individuals across Nepal 
                with licensed therapists who provide personalized support through secure 
                video, audio, and messaging sessions.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                We understand that seeking help can be challenging. That's why we've created 
                a safe, confidential space where you can connect with professionals who truly 
                care about your well-being, from the comfort of your own home.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/therapists">Find a Therapist</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/services">Our Services</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <Award className="h-10 w-10 text-primary" />
              <h3 className="mt-6 text-2xl font-semibold text-foreground">Built for trusted care</h3>
              <p className="mt-4 text-muted-foreground">
                Manochitta Sathi is focused on secure booking, verified therapist approvals, role-based access, and practical mental wellbeing tools that work for real users, therapists, and admins.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Therapist discovery and real availability booking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Secure user, therapist, and admin workflows
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Resources, feedback, notifications, and care continuity tools
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do at Mannochitta Sathi
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Journey</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From a small idea to Nepal's growing mental health platform
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
              
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className="relative flex gap-6 pb-8 last:pb-0">
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="pt-3">
                    <h3 className="font-semibold text-foreground text-lg">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the dedicated team working to make mental health care accessible to all
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
                <Card key={member.name} className="text-center">
                  <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary-foreground mb-2">10,000+</p>
              <p className="text-primary-foreground/80">Sessions Completed</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-foreground mb-2">89+</p>
              <p className="text-primary-foreground/80">Qualified Therapists</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-foreground mb-2">12,000+</p>
              <p className="text-primary-foreground/80">Lives Impacted</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-foreground mb-2">4.8</p>
              <p className="text-primary-foreground/80">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Join Us in Making a Difference
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Whether you're seeking support or want to provide it, we're here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/therapists">Find a Therapist</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/jobs">Join Our Team</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
