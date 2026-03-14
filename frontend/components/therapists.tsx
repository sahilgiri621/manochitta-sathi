import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const doctorImages = [
  { src: "/images/doctors/doctor-1.png", alt: "Dr. Rajesh Karki" },
  { src: "/images/doctors/doctor-2.png", alt: "Dr. Anjali Shrestha" },
  { src: "/images/doctors/doctor-3.jpg", alt: "Dr. Sita Gurung" },
  { src: "/images/doctors/doctor-4.png", alt: "Dr. Bikash Thapa" },
  { src: "/images/doctors/doctor-5.png", alt: "Dr. Prabha Maharjan" },
  { src: "/images/doctors/doctor-6.png", alt: "Dr. Sunita Tamang" },
]

export function Therapists() {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-balance">
              Professional and qualified therapists who you can trust
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Tap into Nepal&apos;s largest network of qualified and
              experienced therapists who can help you with a range of
              issues including depression, anxiety, relationships,
              trauma, grief, and more. With our therapists, you get the
              same professionalism and quality you would expect from
              an in-office therapist, but with the ability to
              communicate when and how you want.
            </p>
            <Link href="/therapists">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                Get matched to a therapist
              </Button>
            </Link>
          </div>

          {/* Right side - Therapist Grid */}
          <div className="order-1 lg:order-2">
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {doctorImages.map((doctor, index) => (
                <div 
                  key={index}
                  className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-border hover:shadow-lg transition-shadow"
                >
                  <Image
                    src={doctor.src}
                    alt={doctor.alt}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
