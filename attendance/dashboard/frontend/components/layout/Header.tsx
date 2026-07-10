"use client"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, CheckCircle2, AlertTriangle, FileEdit, ClipboardList } from "lucide-react"
import { navigation } from "@/components/layout/navigation"
import { CommandSearch } from "@/components/layout/command-search"
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

  const initials = user ? `${(user.prenom?.[0] ?? "").toUpperCase()}${(user.nom?.[0] ?? "").toUpperCase()}` : ""

  const anomalies = notifs?.anomalies ?? 0
  const modifications = notifs?.modifications ?? 0
  const requests = notifs?.requests ?? 0

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const total = anomalies + modifications + requests

  return (
    <header className="glass-header sticky top-0 z-40 flex h-20 min-h-20 items-center justify-between border-b border-border px-8 shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">
        {current?.label ?? "Tableau de bord"}
      </h1>

      <div className="flex items-center gap-3">
        <CommandSearch />

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
            className="group flex items-center gap-3 rounded-full py-1 pl-1 pr-1 transition hover:bg-muted sm:pr-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-foreground">
                {user?.prenom} {user?.nom}
              </span>
              <span className="block text-xs capitalize leading-tight text-muted-foreground">
                {user?.role}
              </span>
            </span>
          </button>
        )}
      </div>
    </header>
  )
}

export { Header }