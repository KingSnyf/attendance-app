"use client"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, CheckCircle2, AlertTriangle, FileEdit, ClipboardList } from "lucide-react"
import { api } from "@/lib/api"
import { navigation } from "@/components/layout/navigation"
import { useAuth } from "@/hooks/useAuth"

function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const current = navigation.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  )
  const [open, setOpen] = useState(false)
  const [anomalies, setAnomalies] = useState(0)
  const [modifications, setModifications] = useState(0)
  const [requests, setRequests] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const initials = user ? `${(user.prenom?.[0] ?? "").toUpperCase()}${(user.nom?.[0] ?? "").toUpperCase()}` : ""

  useEffect(() => {
    const fetch = () => {
      api.getAnomalies().then((list) => setAnomalies(list.filter((a: any) => !a.traitee).length)).catch(() => {})
      api.getModificationRequests().then((list) => setModifications((list as any[]).filter((m: any) => m.statut === "en_attente").length)).catch(() => {})
      api.getPendingRequests().then((r) => setRequests(r.count)).catch(() => {})
    }
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
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