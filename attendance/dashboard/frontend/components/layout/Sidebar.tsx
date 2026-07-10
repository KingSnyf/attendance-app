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
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
          <Fingerprint className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-base font-bold leading-none tracking-tight text-white">
            Attendance
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
            Tableau de bord
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {visibleItems.map((item) => {
          const isDashboard = item.href === "/dashboard"
          const active = pathname === item.href || (!isDashboard && pathname.startsWith(item.href + "/"))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "border-sidebar-primary bg-white/5 text-white"
                  : "border-transparent text-sidebar-foreground/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
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
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export { Sidebar }