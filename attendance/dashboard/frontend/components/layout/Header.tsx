"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, CheckCircle2, AlertTriangle, FileEdit, ClipboardList, Search, Users, FileText } from "lucide-react"
import { navigation } from "@/components/layout/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/lib/hooks/use-notifications"

function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const current = navigation.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  )
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: notifs } = useNotifications()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ employes: any[]; anomalies: any[]; logs: any[] }>({ employes: [], anomalies: [], logs: [] })
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const initials = user ? `${(user.prenom?.[0] ?? "").toUpperCase()}${(user.nom?.[0] ?? "").toUpperCase()}` : ""

  const anomalies = notifs?.anomalies ?? 0
  const modifications = notifs?.modifications ?? 0
  const requests = notifs?.requests ?? 0

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults({ employes: [], anomalies: [], logs: [] }); return }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002/api"}/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("attendance_token")}` },
        })
        if (res.ok) setSearchResults(await res.json())
      } catch {}
    }, 300)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const total = anomalies + modifications + requests

  return (
    <header className="flex h-20 min-h-20 items-center justify-between border-b border-border bg-card px-8">
      <h1 className="text-xl font-semibold text-foreground">
        {current?.label ?? "Tableau de bord"}
      </h1>

      <div className="flex items-center gap-5">
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-1.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => { handleSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              className="w-48 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          {searchOpen && searchQuery.length >= 2 && (
            <div className="absolute right-0 top-12 w-lg rounded-2xl border border-border bg-card p-4 shadow-lg z-50">
              {searchResults.employes.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><Users className="size-3" /> Employés</p>
                  {searchResults.employes.map((emp: any) => (
                    <button key={emp.id} onClick={() => { router.push(`/dashboard/employes/${emp.id}`); setSearchOpen(false); setSearchQuery(""); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition text-left">
                      <span className="font-medium">{emp.prenom} {emp.nom}</span>
                      <span className="text-muted-foreground text-xs">{emp.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.anomalies.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><AlertTriangle className="size-3" /> Anomalies</p>
                  {searchResults.anomalies.map((a: any) => (
                    <button key={a.id} onClick={() => { router.push("/dashboard/anomalies"); setSearchOpen(false); setSearchQuery(""); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition text-left">
                      <span className="font-medium">{a.type}</span>
                      <span className="text-muted-foreground text-xs truncate">{a.description}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.logs.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><FileText className="size-3" /> Logs</p>
                  {searchResults.logs.map((l: any) => (
                    <button key={l.id} onClick={() => { router.push("/dashboard/logs"); setSearchOpen(false); setSearchQuery(""); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition text-left">
                      <span className="font-medium">{l.action}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.employes.length === 0 && searchResults.anomalies.length === 0 && searchResults.logs.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun résultat</p>
              )}
            </div>
          )}
        </div>

        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative flex size-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-6" />
            {total > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white ring-2 ring-card">
                {total > 9 ? "9+" : total}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-md rounded-2xl border border-border bg-card p-5 shadow-lg z-50">
              <p className="mb-4 text-base font-semibold text-foreground">Notifications</p>
              <div className="space-y-3">
                <button
                  onClick={() => { router.push("/dashboard/anomalies"); setOpen(false); }}
                  className="flex w-full items-center gap-4 rounded-xl bg-muted/50 px-4 py-3.5 text-left hover:bg-muted transition"
                >
                  <AlertTriangle className="size-5 shrink-0 text-warning-foreground" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">{anomalies}</span>{" "}
                    <span className="text-muted-foreground">anomalie{anomalies > 1 ? "s" : ""} non traitée{anomalies > 1 ? "s" : ""}</span>
                  </div>
                </button>
                <button
                  onClick={() => { router.push("/dashboard/modifications"); setOpen(false); }}
                  className="flex w-full items-center gap-4 rounded-xl bg-muted/50 px-4 py-3.5 text-left hover:bg-muted transition"
                >
                  <FileEdit className="size-5 shrink-0 text-brand" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">{modifications}</span>{" "}
                    <span className="text-muted-foreground">demande{modifications > 1 ? "s" : ""} en attente</span>
                  </div>
                </button>
                <button
                  onClick={() => { router.push("/dashboard/demandes"); setOpen(false); }}
                  className="flex w-full items-center gap-4 rounded-xl bg-muted/50 px-4 py-3.5 text-left hover:bg-muted transition"
                >
                  <ClipboardList className="size-5 shrink-0 text-signal" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">{requests}</span>{" "}
                    <span className="text-muted-foreground">demande{requests > 1 ? "s" : ""} en attente</span>
                  </div>
                </button>
                {total === 0 && (
                  <div className="flex items-center gap-4 rounded-xl bg-success px-4 py-3.5">
                    <CheckCircle2 className="size-5 shrink-0 text-success-foreground" />
                    <span className="text-sm font-medium text-success-foreground">Tout est à jour</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {initials && (
          <button
            onClick={() => router.push("/dashboard/parametres")}
            className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-base font-semibold text-brand transition hover:bg-brand/20"
          >
            {initials}
          </button>
        )}
      </div>
    </header>
  )
}

export { Header }
