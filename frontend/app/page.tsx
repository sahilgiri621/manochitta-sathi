import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Stats } from "@/components/stats"
import { Therapists } from "@/components/therapists"
import { HowItWorks } from "@/components/how-it-works"
import { Comparison } from "@/components/comparison"
import { FAQ } from "@/components/faq"
import { GiftSection } from "@/components/gift-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Stats />
      <Therapists />
      <HowItWorks />
      <Comparison />
      <FAQ />
      <GiftSection />
      <Footer />
    </main>
  )
}
