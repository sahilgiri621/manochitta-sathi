import Link from "next/link"
import Image from "next/image"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { width: 40, height: 25 },
    md: { width: 64, height: 40 },
    lg: { width: 88, height: 55 },
    xl: { width: 120, height: 75 },
  }

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  return (
    <Link href="/" className={`flex items-center gap-2 transition-opacity hover:opacity-80 ${className}`}>
      <Image
        src="/images/ms-logo.png"
        alt="Manochitta Sathi"
        width={sizes[size].width}
        height={sizes[size].height}
        className="object-contain"
        priority
      />
      {showText && (
        <span className={`${textSizes[size]} font-semibold text-foreground`}>
          Manochitta Sathi
        </span>
      )}
    </Link>
  )
}

export function LogoIcon({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: { width: 32, height: 20 },
    md: { width: 56, height: 35 },
    lg: { width: 80, height: 50 },
    xl: { width: 112, height: 70 },
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/images/ms-logo.png"
        alt="Manochitta Sathi"
        width={sizes[size].width}
        height={sizes[size].height}
        className="object-contain"
      />
    </div>
  )
}
