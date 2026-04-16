import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqEntries } from "@/lib/content"

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Frequently asked questions
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Find answers to common questions about Mannochitta Sathi.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {faqEntries.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="bg-card border border-border rounded-lg px-4"
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-primary-foreground/90 max-w-xl mx-auto mb-8">
            Take the first step towards better mental health today.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/therapists">Get matched with a therapist</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
