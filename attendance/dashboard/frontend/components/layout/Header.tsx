"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, FileEdit, Menu, Search } from "lucide-react"
import { navigation } from "@/components/layout/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { useEmployees } from "@/lib/hooks/use-employees"
import { getNomComplet } from "@/lib/utils"

function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const current = navigation.find((item) => item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href))
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: notifs } = useNotifications()
  const { data: employees = [] } = useEmployees()
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const initials = user ? `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase() : ""
  const counts = {
    anomalies: notifs?.anomalies ?? 0,
    modifications: notifs?.modifications ?? 0,
    requests: notifs?.requests ?? 0,
  }
  const total = counts.anomalies + counts.modifications + counts.requests

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return employees
      .filter((employee) => getNomComplet(employee).toLowerCase().includes(q) || employee.departement?.toLowerCase().includes(q))
      .slice(0, 6)
  }, [employees, search])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchOpen(false)
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

      <div ref={searchRef} className="relative mx-4 hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9298a8]" />
        <input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setSearchOpen(true) }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Rechercher un employé, un département..."
          className="h-9 w-full rounded-md border border-[#e2e5eb] bg-[#f7f8fa] pl-8 pr-3 text-[11px] outline-none focus:border-[#5363dc] focus:bg-white"
        />
        {searchOpen && search.trim() && (
          <div className="absolute left-0 top-11 w-80 rounded-lg border border-[#e1e5eb] bg-white p-2 shadow-xl">
            {searchResults.map((employee) => (
              <button
                key={employee.id}
                onClick={() => { router.push(`/dashboard/employes/${employee.id}`); setSearch(""); setSearchOpen(false) }}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#f7f8fa]"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eef1ff] text-[10px] font-semibold text-[#5363dc]">
                  {getNomComplet(employee).slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-[#17203a]">{getNomComplet(employee)}</span>
                  <span className="block truncate text-[9px] text-[#8a91a3]">{employee.departement}</span>
                </span>
              </button>
            ))}
            {!searchResults.length && <p className="p-3 text-center text-[11px] text-[#8a91a3]">Aucun résultat.</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div ref={ref} className="relative">
          <button onClick={() => setOpen(!open)} className="relative flex size-10 items-center justify-center rounded-lg text-[#6e7587] hover:bg-[#f4f6f9]" aria-label="Notifications">
            <Bell className="size-5" />
            {total > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#df5967] px-1 text-[9px] font-semibold text-white ring-2 ring-white">
                {total > 9 ? "9+" : total}
              </span>
            )}
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