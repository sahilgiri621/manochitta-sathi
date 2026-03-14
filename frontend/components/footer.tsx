import Link from "next/link"
import Image from "next/image"
import { Shield, Lock } from "lucide-react"

const footerLinks = [
  {
    title: "Company",
    links: [
      { label: "Home", href: "#" },
      { label: "Business", href: "#" },
      { label: "About", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Advice", href: "#" },
      { label: "Reviews", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Find a Therapist", href: "#" },
      { label: "Online Therapy", href: "#" },
      { label: "Therapist Jobs", href: "#" },
      { label: "Contact", href: "#" },
      { label: "For Therapists", href: "#" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo and Security */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image 
                src="/images/logo.png" 
                alt="Mannochitta Sathi Logo" 
                width={48} 
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg text-foreground">Mannochitta Sathi</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              If you are in a crisis or any other person may be in danger - don&apos;t use this site.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="text-xs">HIPAA</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-xs">Secure</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Additional Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Web Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 Mannochitta Sathi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
