"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock3, LogOut, X } from "lucide-react"
import { navigation } from "@/components/layout/navigation"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const visibleItems = navigation.filter((item) => !user || !item.roles || item.roles.includes(user.role as "admin" | "gestionnaire" | "employe"))

  return (
    <aside className="flex h-full w-60 flex-col border-r border-[#e7eaf0] bg-white text-[#17203a]">
      <div className="flex h-20 items-center border-b border-[#edf0f4] px-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3" aria-label="Attendance X">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#5665df] text-white shadow-sm">
            <Clock3 className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#111a35]">Attendance X</span>
            <span className="block truncate text-[9px] uppercase text-[#9298a8]">Gestion des présences</span>
          </span>
        </Link>
        <button onClick={onClose} className="absolute right-2 top-2 text-[#7d8498] lg:hidden" aria-label="Fermer le menu">
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[11px] font-medium transition",
                active ? "bg-[#eef1ff] text-[#5261d9]" : "text-[#7d8498] hover:bg-[#f4f6f9] hover:text-[#17203a]",
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#edf0f4] p-3">
        <div className="mb-2 flex items-center justify-between rounded-lg bg-[#f6f7f9] px-3 py-2">
          <span className="text-[9px] text-[#9298a8]">Heure locale</span>
          <span className="font-data text-[10px] font-semibold text-[#17203a]">
            {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <button onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[11px] font-medium text-[#7d8498] hover:bg-[#fff0f0] hover:text-[#c84d58]" title="Déconnexion" aria-label="Déconnexion">
          <LogOut className="size-4.5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

export { Sidebar }
