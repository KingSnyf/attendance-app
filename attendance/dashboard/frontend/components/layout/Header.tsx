"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, FileEdit, Menu } from "lucide-react"
import { navigation } from "@/components/layout/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/lib/hooks/use-notifications"

function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const current = navigation.find((item) => item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href))
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: notifs } = useNotifications()
  const initials = user ? `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase() : ""
  const counts = {
    anomalies: notifs?.anomalies ?? 0,
    modifications: notifs?.modifications ?? 0,
    requests: notifs?.requests ?? 0,
  }
  const total = counts.anomalies + counts.modifications + counts.requests

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-20 min-h-20 items-center justify-between border-b border-[#e7eaf0] bg-white px-4 sm:px-7">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-[#70788a] lg:hidden" aria-label="Ouvrir le menu"><Menu className="size-5" /></button>
        <div className="hidden items-center gap-7 sm:flex">
          <div>
            <p className="text-[10px] text-[#8a91a3]">{current?.label ?? "Présence"}</p>
            <p className="font-data flex items-center gap-2 text-sm font-semibold text-[#111a35]">
              {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date())}
              <CalendarDays className="size-3.5 text-[#7c8496]" />
            </p>
          </div>
          <span className="h-9 w-px bg-[#e6e9ef]" />
          <div>
            <p className="text-[10px] text-[#8a91a3]">Horaire principal</p>
            <p className="font-data flex items-center gap-1.5 text-sm font-semibold text-[#111a35]">09:00 à 17:00 <ChevronDown className="size-3.5 text-[#7c8496]" /></p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div ref={ref} className="relative">
          <button onClick={() => setOpen(!open)} className="relative flex size-10 items-center justify-center rounded-lg text-[#6e7587] hover:bg-[#f4f6f9]" aria-label="Notifications">
            <Bell className="size-5" />
            {total > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#df5967] ring-2 ring-white" />}
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-80 rounded-lg border border-[#e1e5eb] bg-white p-4 shadow-xl">
              <p className="mb-3 text-sm font-semibold">Notifications</p>
              {([
                { Icon: AlertTriangle, count: counts.anomalies, label: "anomalie(s) à traiter", href: "/dashboard/anomalies" },
                { Icon: FileEdit, count: counts.modifications, label: "modification(s) en attente", href: "/dashboard/modifications" },
                { Icon: ClipboardList, count: counts.requests, label: "demande(s) en attente", href: "/dashboard/demandes" },
              ]).map(({ Icon, count, label, href }) => (
                <button key={href} onClick={() => { router.push(href); setOpen(false) }} className="flex w-full items-center gap-3 border-b border-[#eef0f3] px-1 py-3 text-left last:border-0">
                  <Icon className="size-4 text-[#5665df]" />
                  <span className="text-xs text-[#697084]"><b className="text-[#17203a]">{count}</b> {label}</span>
                </button>
              ))}
              {total === 0 && <p className="flex items-center gap-2 text-xs text-[#2e9b7d]"><CheckCircle2 className="size-4" /> Tout est à jour</p>}
            </div>
          )}
        </div>

        {initials && (
          <button onClick={() => router.push("/dashboard/parametres")} className="flex items-center gap-2 rounded-full bg-[#f7f8fa] py-1 pl-1 pr-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#d1ad91] text-xs font-semibold text-white">{initials}</span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-semibold text-[#17203a]">{user?.prenom} {user?.nom}</span>
              <span className="block text-[10px] capitalize text-[#8a91a3]">{user?.role}</span>
            </span>
            <ChevronDown className="size-3.5 text-[#7c8496]" />
          </button>
        )}
      </div>
    </header>
  )
}

export { Header }
