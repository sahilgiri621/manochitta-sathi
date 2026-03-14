import { MessageCircle, Users, Heart } from "lucide-react"

const stats = [
  {
    number: "465,674,673",
    label: "Messages, chat, audio, video sessions",
    icon: MessageCircle,
  },
  {
    number: "31,975",
    label: "Qualified therapists ready to help",
    icon: Users,
  },
  {
    number: "6,297,112",
    label: "People got help",
    icon: Heart,
  },
]

export function Stats() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Heading */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">B</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              The world&apos;s largest therapy service.
            </h2>
            <p className="text-2xl md:text-3xl font-bold text-primary">
              100% online.
            </p>
          </div>

          {/* Right side - Stats */}
          <div className="space-y-6">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {stat.number}
                  </p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
