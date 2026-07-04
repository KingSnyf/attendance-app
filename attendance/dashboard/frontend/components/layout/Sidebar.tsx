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
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <Fingerprint className="size-6 text-brand" />
        <span className="text-lg font-bold text-foreground">Attendance</span>
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 text-sm">
          <p className="font-medium text-foreground">{user?.prenom} {user?.nom}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export { Sidebar }
