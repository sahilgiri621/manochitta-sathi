"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Briefcase, ChevronRight, Heart, Users, Laptop, GraduationCap } from "lucide-react"
import { useState } from "react"

const jobCategories = [
  { id: "all", label: "All Positions" },
  { id: "therapist", label: "Therapists" },
  { id: "clinical", label: "Clinical" },
  { id: "operations", label: "Operations" },
  { id: "tech", label: "Technology" },
]

const jobListings = [
  {
    id: 1,
    title: "Licensed Clinical Psychologist",
    category: "therapist",
    type: "Full-time / Part-time",
    location: "Remote (Nepal)",
    experience: "3+ years",
    salary: "NPR 60,000 - NPR 1,20,000/month",
    description: "Join our network of mental health professionals providing online therapy services. Work flexible hours from anywhere in Nepal.",
    requirements: [
      "M.Phil or PhD in Clinical Psychology",
      "Valid RCI registration",
      "Minimum 3 years of clinical experience",
      "Proficiency in English and Hindi",
    ],
    benefits: ["Flexible schedule", "Work from home", "Competitive pay", "Professional development"],
    featured: true,
  },
  {
    id: 2,
    title: "Licensed Counseling Psychologist",
    category: "therapist",
    type: "Part-time",
    location: "Remote (Nepal)",
    experience: "2+ years",
    salary: "NPR 40,000 - NPR 80,000/month",
    description: "Provide counseling services to clients dealing with anxiety, depression, relationship issues, and life transitions.",
    requirements: [
      "M.A. or M.Sc. in Psychology with specialization in Counseling",
      "Valid counseling certification",
      "Experience with online therapy platforms",
      "Strong communication skills",
    ],
    benefits: ["Flexible hours", "Remote work", "Ongoing training", "Supportive team"],
    featured: true,
  },
  {
    id: 3,
    title: "Couples & Family Therapist",
    category: "therapist",
    type: "Part-time",
    location: "Remote (Nepal)",
    experience: "4+ years",
    salary: "NPR 50,000 - NPR 1,00,000/month",
    description: "Specialize in helping couples and families improve communication, resolve conflicts, and build stronger relationships.",
    requirements: [
      "Master's degree in Marriage & Family Therapy or related field",
      "Certification in couples/family therapy",
      "Experience with relationship counseling",
      "Cultural sensitivity",
    ],
    benefits: ["Set your own hours", "Work remotely", "Competitive compensation", "Case consultation support"],
    featured: false,
  },
  {
    id: 4,
    title: "Child & Adolescent Therapist",
    category: "therapist",
    type: "Full-time",
    location: "Remote (Nepal)",
    experience: "3+ years",
    salary: "NPR 55,000 - NPR 95,000/month",
    description: "Work with children and teenagers facing academic stress, behavioral issues, anxiety, and developmental challenges.",
    requirements: [
      "Specialization in Child/Adolescent Psychology",
      "Experience with play therapy or CBT for children",
      "Ability to engage young clients online",
      "Parent communication skills",
    ],
    benefits: ["Meaningful work", "Flexible scheduling", "Training resources", "Supervision support"],
    featured: false,
  },
  {
    id: 5,
    title: "Clinical Supervisor",
    category: "clinical",
    type: "Full-time",
    location: "Remote / Hybrid (Kathmandu)",
    experience: "7+ years",
    salary: "NPR 1,20,000 - NPR 1,80,000/month",
    description: "Lead and supervise our clinical team, ensure quality of care, and develop clinical protocols and training programs.",
    requirements: [
      "PhD in Clinical Psychology",
      "7+ years of clinical experience",
      "Previous supervisory experience",
      "Strong leadership skills",
    ],
    benefits: ["Leadership role", "Competitive salary", "Health insurance", "Professional growth"],
    featured: true,
  },
  {
    id: 6,
    title: "Quality Assurance Specialist",
    category: "clinical",
    type: "Full-time",
    location: "Remote (Nepal)",
    experience: "3+ years",
    salary: "NPR 50,000 - NPR 75,000/month",
    description: "Monitor and ensure the quality of therapy services, review session notes, and provide feedback to therapists.",
    requirements: [
      "Background in mental health or healthcare quality",
      "Attention to detail",
      "Experience with compliance and standards",
      "Data analysis skills",
    ],
    benefits: ["Remote work", "Impactful role", "Growth opportunities", "Team environment"],
    featured: false,
  },
  {
    id: 7,
    title: "Operations Manager",
    category: "operations",
    type: "Full-time",
    location: "Hybrid (Kathmandu)",
    experience: "5+ years",
    salary: "NPR 80,000 - NPR 1,20,000/month",
    description: "Oversee daily operations, manage therapist onboarding, optimize processes, and ensure smooth platform functioning.",
    requirements: [
      "MBA or equivalent experience",
      "Experience in healthcare or tech operations",
      "Strong project management skills",
      "Data-driven decision making",
    ],
    benefits: ["Leadership opportunity", "Competitive package", "Health benefits", "Stock options"],
    featured: false,
  },
  {
    id: 8,
    title: "Customer Support Lead",
    category: "operations",
    type: "Full-time",
    location: "Remote (Nepal)",
    experience: "3+ years",
    salary: "NPR 45,000 - NPR 65,000/month",
    description: "Lead our customer support team, handle escalations, and ensure excellent user experience for clients and therapists.",
    requirements: [
      "Experience in customer support management",
      "Empathetic communication style",
      "Problem-solving skills",
      "Knowledge of mental health helpful",
    ],
    benefits: ["Work from home", "Team leadership", "Training provided", "Career growth"],
    featured: false,
  },
  {
    id: 9,
    title: "Senior Full Stack Developer",
    category: "tech",
    type: "Full-time",
    location: "Remote / Hybrid (Kathmandu)",
    experience: "4+ years",
    salary: "NPR 18,00,000 - NPR 28,00,000/year",
    description: "Build and maintain our therapy platform, develop new features, and ensure a seamless experience for users.",
    requirements: [
      "Strong experience with React, Node.js, TypeScript",
      "Experience with real-time communication (WebRTC)",
      "Database design and optimization",
      "Security best practices",
    ],
    benefits: ["Remote-first", "Latest tech stack", "Stock options", "Learning budget"],
    featured: false,
  },
  {
    id: 10,
    title: "Product Designer",
    category: "tech",
    type: "Full-time",
    location: "Remote (Nepal)",
    experience: "3+ years",
    salary: "NPR 12,00,000 - NPR 20,00,000/year",
    description: "Design intuitive and empathetic user experiences for our therapy platform that make mental health accessible.",
    requirements: [
      "Strong portfolio in product design",
      "Experience with healthcare or wellness apps",
      "Proficiency in Figma",
      "User research skills",
    ],
    benefits: ["Meaningful product", "Creative freedom", "Remote work", "Competitive pay"],
    featured: false,
  },
]

const whyJoinUs = [
  {
    icon: Heart,
    title: "Make a Difference",
    description: "Help millions access mental health support and change lives every day.",
  },
  {
    icon: Laptop,
    title: "Work Flexibly",
    description: "Remote-first culture with flexible hours to maintain your work-life balance.",
  },
  {
    icon: Users,
    title: "Supportive Team",
    description: "Join a passionate team dedicated to mental health and well-being.",
  },
  {
    icon: GraduationCap,
    title: "Grow Professionally",
    description: "Access continuous learning, training, and career development opportunities.",
  },
]

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [expandedJob, setExpandedJob] = useState<number | null>(null)

  const filteredJobs =
    selectedCategory === "all"
      ? jobListings
      : jobListings.filter((job) => job.category === selectedCategory)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="bg-primary py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4 text-balance">
            Join Our Team
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto text-pretty">
            Help us make mental health support accessible to everyone. Explore career opportunities at Mannochitta Sathi.
          </p>
        </div>
      </section>

      <section className="py-16 bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Why Work With Us
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyJoinUs.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
            Open Positions
          </h2>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {jobCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`rounded-full ${selectedCategory === category.id ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className={`border-border transition-all ${job.featured ? "border-l-4 border-l-primary" : ""}`}
              >
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg text-foreground">{job.title}</CardTitle>
                        {job.featured && (
                          <Badge className="bg-accent text-accent-foreground text-xs">Featured</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.experience}
                        </span>
                        <span className="flex items-center gap-1">{job.salary}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedJob === job.id ? "rotate-90" : ""}`} />
                  </div>
                </CardHeader>

                {expandedJob === job.id && (
                  <CardContent className="border-t border-border pt-4">
                    <p className="text-muted-foreground mb-4">{job.description}</p>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Requirements</h4>
                        <ul className="space-y-1">
                          {job.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Benefits</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.benefits.map((benefit, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                      Apply Now
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No positions available in this category at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Are you a licensed therapist?
          </h2>
          <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
            Join our growing network of mental health professionals. Set your own schedule, work from anywhere, and help people who need it most.
          </p>
          <Button variant="secondary" size="lg" className="rounded-full px-8">
            Apply as a Therapist
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  )
}
