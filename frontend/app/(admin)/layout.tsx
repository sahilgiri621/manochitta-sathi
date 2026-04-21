"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  FolderTree,
  Calendar,
  MessageSquareQuote,
  LifeBuoy,
  Wallet,
  TrendingUp,
  Bell,
  Menu,
  LogOut,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { NotificationBell } from "@/components/notifications/notification-bell"

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/therapists", label: "Therapists", icon: UserCog },
  { href: "/admin/appointments", label: "Appointments", icon: Calendar },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquareQuote },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/packages", label: "Packages", icon: Wallet },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
]

function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const initial = user?.name?.charAt(0)?.toUpperCase() || "A"

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-[#1a1a2e] text-white", className)}>
      <div className="shrink-0 border-b border-white/10 px-5 py-4">
        <Link href="/" className="flex flex-col items-start gap-2">
          <Logo className="[&_span]:text-white" size="sm" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
            Admin Portal
          </span>
        </Link>
      </div>
      <nav className="min-h-0 flex-1 p-3">
        <ul className="flex flex-col gap-0.5">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="shrink-0 border-t border-white/10 p-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
            <p className="text-xs text-white/50 truncate">{user?.email || ""}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isLoading } = useAuth()
  const initial = user?.name?.charAt(0)?.toUpperCase() || "A"

  if (isLoading || !user) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-[#1a1a2e] border-none">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell role={user.role} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/users">
                    <User className="mr-2 h-4 w-4" />
                    Users
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
