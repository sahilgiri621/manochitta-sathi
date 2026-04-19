"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CrisisSupportBanner } from "@/components/crisis-support-banner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  HelpCircle,
  Briefcase,
  Shield,
} from "lucide-react"

const contactReasons = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing Question" },
  { value: "therapist", label: "Therapist Inquiry" },
  { value: "partnership", label: "Partnership Opportunity" },
  { value: "press", label: "Press/Media" },
]

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "support@manochittasathi.com",
    description: "We'll respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+977 01-XXXXXXX",
    description: "Mon-Fri, 9am-6pm NPT",
  },
  {
    icon: MapPin,
    title: "Address",
    value: "Kathmandu, Nepal",
    description: "Head Office",
  },
  {
    icon: Clock,
    title: "Support Hours",
    value: "24/7 Chat Support",
    description: "For urgent matters",
  },
]

const quickLinks = [
  {
    icon: HelpCircle,
    title: "FAQ",
    description: "Find answers to common questions",
    href: "/faq",
  },
  {
    icon: MessageSquare,
    title: "Email Support",
    description: "Reach our support team directly",
    href: "mailto:support@manochittasathi.com",
  },
  {
    icon: Briefcase,
    title: "Careers",
    description: "Join our growing team",
    href: "/jobs",
  },
  {
    icon: Shield,
    title: "For Therapists",
    description: "Learn about joining our platform",
    href: "/for-therapists",
  },
]

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    reason: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(formState.subject || "Contact request")
    const body = encodeURIComponent(
      `Name: ${formState.name}\nEmail: ${formState.email}\nReason: ${formState.reason || "General inquiry"}\n\n${formState.message}`
    )
    window.location.href = `mailto:support@manochittasathi.com?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info) => (
              <div key={info.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <info.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{info.title}</p>
                  <p className="text-foreground">{info.value}</p>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you shortly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          value={formState.name}
                          onChange={(e) =>
                            setFormState({ ...formState, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formState.email}
                          onChange={(e) =>
                            setFormState({ ...formState, email: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="reason">Reason for Contact</Label>
                        <Select
                          value={formState.reason}
                          onValueChange={(value) =>
                            setFormState({ ...formState, reason: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {contactReasons.map((reason) => (
                              <SelectItem key={reason.value} value={reason.value}>
                                {reason.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Brief subject"
                          value={formState.subject}
                          onChange={(e) =>
                            setFormState({ ...formState, subject: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help..."
                        rows={6}
                        value={formState.message}
                        onChange={(e) =>
                          setFormState({ ...formState, message: e.target.value })
                        }
                        required
                      />
                    </div>

                    <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>
                    Find what you're looking for faster
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {quickLinks.map((link) => (
                    <a
                      key={link.title}
                      href={link.href}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <link.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{link.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {link.description}
                        </p>
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </section>

      <CrisisSupportBanner />

      {/* Visit Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Visit by Appointment</h2>
            <p className="text-muted-foreground">In-person meetings are coordinated in advance through the support team.</p>
          </div>
          <div className="mx-auto max-w-3xl rounded-lg border border-border bg-background p-8 text-center">
            <p className="text-foreground font-medium">Kathmandu, Nepal</p>
            <p className="mt-3 text-muted-foreground">
              To protect privacy and coordinate the right support staff, visits and meetings are arranged only after contacting the team first.
            </p>
            <Button asChild className="mt-6">
              <a href="mailto:support@manochittasathi.com">Email Support</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
