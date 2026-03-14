import { ArrowDown, MessageSquare, Calendar, Video } from "lucide-react"

const steps = [
  {
    title: "Get matched to the best therapist for you",
    description:
      "Answer a few questions to find a qualified therapist who fits your needs and preferences. Tap into the largest online network of credentialed providers.",
    icon: MessageSquare,
  },
  {
    title: "Communicate your way",
    description:
      "Talk to your therapist however you feel comfortable — text, chat, audio, or video. You can expect the same professionalism as an in-office therapist.",
    icon: Video,
  },
  {
    title: "Therapy when you need it",
    description:
      "You can message your therapist at anytime, from anywhere. You also get to schedule live sessions when it's convenient for you, and can connect from any mobile device or computer.",
    icon: Calendar,
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">
          How it works
        </h2>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={index}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Illustration */}
                <div className="flex-shrink-0 w-full md:w-1/2">
                  <div className="aspect-[4/3] rounded-2xl bg-secondary flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-4">
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="flex justify-center my-8">
                  <ArrowDown className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
