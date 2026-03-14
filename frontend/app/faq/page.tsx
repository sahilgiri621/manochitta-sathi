"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"

const faqItems = [
  {
    question: "What is Mannochitta Sathi?",
    answer: "Mannochitta Sathi is a professional online therapy platform that connects you with licensed therapists. Our platform provides convenient, accessible mental health support through chat, audio, and video sessions from the comfort of your home."
  },
  {
    question: "Who will be helping me?",
    answer: "You will be matched with a licensed, trained, experienced, and accredited therapist. Our network includes psychologists, clinical social workers, licensed professional counselors, and marriage and family therapists with extensive experience."
  },
  {
    question: "Who are the therapists?",
    answer: "All therapists on Mannochitta Sathi are licensed mental health professionals with master's or doctoral degrees. They have completed thousands of hours of supervised clinical experience and are credentialed by their state's professional board."
  },
  {
    question: "How are the therapists verified?",
    answer: "Every therapist goes through a rigorous verification process including license verification, background checks, and clinical competency assessments. We continuously monitor their credentials to ensure they remain in good standing."
  },
  {
    question: "Is Mannochitta Sathi right for me?",
    answer: "Mannochitta Sathi may be right for you if you're dealing with anxiety, depression, stress, relationship issues, grief, or other life challenges. However, it's not suitable for crisis situations. If you're in danger, please contact emergency services."
  },
  {
    question: "How much does it cost?",
    answer: "Our pricing varies based on the type of therapy and session format you choose. We offer competitive rates starting from NPR 1,500 per session. Many clients find online therapy to be more affordable than traditional in-office therapy."
  },
  {
    question: "Can Mannochitta Sathi substitute for traditional face-to-face therapy?",
    answer: "Research shows that online therapy can be just as effective as face-to-face therapy for many conditions. Our platform provides a convenient alternative while maintaining the same professional standards and therapeutic approaches."
  },
  {
    question: "I signed up. How long until I'm matched with a therapist?",
    answer: "Most users are matched with a therapist within 24-48 hours of completing our questionnaire. You can browse available therapists and choose one that fits your needs, or we can recommend matches based on your preferences."
  },
  {
    question: "How will I communicate with my therapist?",
    answer: "You can communicate through text messaging in our secure platform, schedule live chat sessions, or book audio and video calls. Your therapist will respond to messages regularly, and you can schedule live sessions at convenient times."
  },
  {
    question: "How does messaging work?",
    answer: "Our messaging feature allows you to write to your therapist anytime. Your therapist will respond at least once daily during weekdays. This format lets you express your thoughts thoughtfully and read your therapist's responses when it's convenient."
  },
  {
    question: "How do live chat sessions work?",
    answer: "Live chat sessions are scheduled real-time text conversations with your therapist. You'll both be online at the same time, exchanging messages instantly. Sessions typically last 30-50 minutes."
  },
  {
    question: "How do live audio sessions work?",
    answer: "Audio sessions are phone-call style conversations through our secure platform. Simply schedule a session, and at the appointed time, you'll connect with your therapist for a voice conversation without video."
  },
  {
    question: "How do live video sessions work?",
    answer: "Video sessions provide face-to-face interaction through secure video conferencing. You'll see and hear your therapist in real-time, creating an experience similar to in-office therapy from wherever you are."
  },
  {
    question: "Can I go back and read the therapist's previous messages?",
    answer: "Yes! All messages are saved in your secure account. You can review past conversations, reflect on insights, and track your progress over time. This is one of the unique benefits of text-based therapy."
  },
  {
    question: "How long can I use Mannochitta Sathi?",
    answer: "You can use Mannochitta Sathi for as long as you need. There's no minimum commitment, and you can continue therapy for weeks, months, or years based on your personal goals and progress."
  },
  {
    question: "Is Mannochitta Sathi accessible for disabled users?",
    answer: "Yes, we're committed to accessibility. Our platform is designed to work with screen readers and other assistive technologies. If you have specific accessibility needs, please contact our support team."
  },
  {
    question: "How will I pay for my membership?",
    answer: "We accept major credit cards, debit cards, and UPI payments. Billing is handled securely through our platform, and you can manage your subscription settings in your account."
  },
  {
    question: "Will my therapist treat what I say as confidential?",
    answer: "Yes, confidentiality is a cornerstone of therapy. Your therapist is bound by professional ethics and laws to keep your information private, with limited exceptions required by law (such as imminent danger to yourself or others)."
  },
  {
    question: "How is my privacy and security protected?",
    answer: "We use bank-level 256-bit encryption to protect all communications. Our platform is designed with privacy in mind, and we never share your personal information with third parties without your consent."
  },
  {
    question: "Can I stay anonymous?",
    answer: "You can use a nickname instead of your real name when communicating with your therapist. While we need some information for verification and payment, your therapist only sees what you choose to share."
  },
  {
    question: "How can I get started with Mannochitta Sathi?",
    answer: "Getting started is easy! Click 'Get Started', answer a few questions about your needs, and we'll match you with suitable therapists. You can then choose your therapist and begin your journey to better mental health."
  },
  {
    question: "I'm a qualified therapist. How can I provide services using Mannochitta Sathi?",
    answer: "We're always looking for qualified therapists to join our network. Visit our Jobs page or contact us directly to learn about requirements, benefits, and the application process for therapist positions."
  }
]

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner */}
      <section className="bg-primary py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground text-balance">
            Frequently asked questions
          </h1>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                <AccordionTrigger className="text-left text-foreground hover:no-underline py-5 text-base md:text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 text-sm md:text-base leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Ready to get started?
          </h2>
          <Link href="/therapists">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg">
              Get matched with a therapist
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
