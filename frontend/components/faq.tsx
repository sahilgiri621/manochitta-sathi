import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const faqs = [
  {
    question: "Who are the therapists?",
    answer:
      "Mannochitta Sathi therapists are licensed, trained, experienced, and accredited psychologists (PhD / PsyD), marriage and family therapists (MFT), clinical social workers (LCSW / LMSW), or licensed professional counselors (LPC). All of them have a Master's Degree or a Doctorate Degree in their field.",
  },
  {
    question: "Who will be helping me?",
    answer:
      "After you sign up, we will match you to an available therapist who fits your objectives, preferences, and the type of issues you are dealing with. If you feel like therapist isn't a good fit for you, you can switch to a different therapist.",
  },
  {
    question: "Is Mannochitta Sathi right for me?",
    answer:
      "Mannochitta Sathi may be right for you if you're looking to improve your quality of life. Anyone who is facing life's challenges can benefit from therapy. It can help you deal with many issues like depression, anxiety, relationship troubles, stress, and more.",
  },
  {
    question: "How much does it cost?",
    answer:
      "The cost of therapy through Mannochitta Sathi typically ranges from NPR 1,500 to NPR 3,000 per session, depending on your preferences, session format, and therapist availability. You can stop or switch your plan at any time.",
  },
  {
    question: "I signed up. How long until I'm matched with a therapist?",
    answer:
      "In most cases, you will be matched with a therapist within a few hours. However, depending on your preferences and therapist availability, it may take up to 24-48 hours to find the best match for you.",
  },
  {
    question: "How will I communicate with my therapist?",
    answer:
      "You can communicate with your therapist in four ways: exchanging messages, chatting live, speaking over the phone, and video conferencing. You can use different communication methods at different times as you wish.",
  },
  {
    question: "Can Mannochitta Sathi substitute for traditional face-to-face therapy?",
    answer:
      "The professionals who work through Mannochitta Sathi are licensed and credentialed therapists who are qualified to provide therapy. However, while the service may have similar benefits, it's not capable of substituting for traditional face-to-face therapy in every case.",
  },
  {
    question: "How long can I use Mannochitta Sathi?",
    answer:
      "This depends on your needs and varies from person to person. Some people feel better after a few weeks, while others may continue therapy for months or years. Research shows that the longer people stay in therapy, the more likely they are to see lasting benefits.",
  },
]

export function FAQ() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          Frequently asked questions
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-lg px-6 bg-card"
            >
              <AccordionTrigger className="text-left text-foreground hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-8">
          <Link
            href="#"
            className="text-primary hover:text-primary/80 text-sm underline"
          >
            More frequently asked questions
          </Link>
        </div>

        <div className="text-center mt-8">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 h-auto">
            Get started
          </Button>
        </div>
      </div>
    </section>
  )
}
