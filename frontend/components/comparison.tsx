import { Check, X, HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const features = [
  { name: "Provided by a qualified therapist", platform: true, office: true, tooltip: "Licensed, trained professionals" },
  { name: "In-office visits", platform: false, office: true },
  { name: "Messaging any time", platform: true, office: false },
  { name: "Chat sessions", platform: true, office: false },
  { name: "Phone sessions", platform: true, office: true },
  { name: "Video sessions", platform: true, office: true },
  { name: "Easy scheduling", platform: true, office: false },
  { name: "Digital worksheets", platform: true, office: false },
  { name: "Group sessions", platform: true, office: false },
  { name: "Smart provider matching", platform: true, office: false },
  { name: "Easy to switch providers", platform: true, office: false },
  { name: "Access from anywhere", platform: true, office: false },
]

export function Comparison() {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          Mannochitta Sathi vs. traditional in-office therapy
        </h2>

        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 p-4 border-b border-border">
            <div></div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-[8px]">M</span>
                </div>
                <span className="text-sm font-semibold text-primary">Mannochitta Sathi</span>
              </div>
            </div>
            <div className="text-center">
              <span className="text-sm font-semibold text-muted-foreground">In-office</span>
            </div>
          </div>

          {/* Features */}
          <TooltipProvider>
            <div className="divide-y divide-border">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{feature.name}</span>
                    {feature.tooltip && (
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{feature.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {feature.platform ? (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                        <X className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {feature.office ? (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                        <X className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </section>
  )
}
