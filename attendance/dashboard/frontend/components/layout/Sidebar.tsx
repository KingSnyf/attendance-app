"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigation } from "@/components/layout/navigation"
import { useAuth } from "@/hooks/useAuth"
import { LogOut, Fingerprint } from "lucide-react"

function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const visibleItems = navigation.filter((item) => {
    if (!user) return true
    return !item.roles || item.roles.includes(user.role as "admin" | "gestionnaire" | "employe")
  })

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-6 py-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
          <Fingerprint className="size-4.5" />
        </span>
        <span className="font-heading text-lg font-semibold tracking-tight text-white">
          Attendance
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const isDashboard = item.href === "/dashboard"
          const active = pathname === item.href || (!isDashboard && pathname.startsWith(item.href + "/"))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-full bg-sidebar-primary" />
              )}
              <item.icon className="size-4.5" />
              {item.label}
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" aria-hidden />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-heading text-xs font-semibold text-white">
            {(user?.prenom?.[0] ?? "").toUpperCase()}{(user?.nom?.[0] ?? "").toUpperCase()}
          </span>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium text-white">{user?.prenom} {user?.nom}</p>
            <p className="truncate text-xs capitalize text-sidebar-foreground/70">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent/60 hover:text-white"
        >
          <LogOut className="size-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export { Sidebar }