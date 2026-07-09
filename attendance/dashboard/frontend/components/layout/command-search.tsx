"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, AlertTriangle, FileText, Loader2, X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

type SearchResult = {
  employes: Array<{ id: string; nom: string; prenom: string; email: string; role: string; departement: string; photo_url: string | null }>
  anomalies: Array<{ id: string; type: string; description: string; date_detection: string; employe: string | null }>
  logs: Array<{ id: string; action: string; details: string; date: string }>
}

type ResultCategory = keyof SearchResult

const CATEGORIES: { key: ResultCategory; icon: typeof Users; label: string }[] = [
  { key: "employes", icon: Users, label: "Employés" },
  { key: "anomalies", icon: AlertTriangle, label: "Anomalies" },
  { key: "logs", icon: FileText, label: "Logs" },
]

function CommandSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult>({ employes: [], anomalies: [], logs: [] })
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const flatResults = (() => {
    const flat: Array<{ category: ResultCategory; item: any }> = []
    for (const cat of CATEGORIES) {
      for (const item of results[cat.key]) {
        flat.push({ category: cat.key, item })
      }
    }
    return flat
  })()

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults({ employes: [], anomalies: [], logs: [] }); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002/api"}/search?q=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("attendance_token")}` } },
        )
        if (res.ok) setResults(await res.json())
      } catch {}
      setLoading(false)
    }, 300)
  }, [])

  const navigate = (idx: number) => {
    const entry = flatResults[idx]
    if (!entry) return
    const { category, item } = entry
    if (category === "employes") router.push(`/dashboard/employes/${item.id}`)
    else if (category === "anomalies") router.push("/dashboard/anomalies")
    else router.push("/dashboard/logs")
    close()
  }

  const close = () => { setOpen(false); setQuery(""); setResults({ employes: [], anomalies: [], logs: [] }); setActiveIndex(0) }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((prev) => !prev) }
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((prev) => Math.min(prev + 1, flatResults.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((prev) => Math.max(prev - 1, 0)) }
    if (e.key === "Enter") { e.preventDefault(); navigate(activeIndex) }
  }

  const hasResults = flatResults.length > 0
  const showEmpty = query.length >= 2 && !loading && !hasResults

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden sm:inline">Rechercher...</span>
        <kbd className="ml-auto hidden rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground/70 lg:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              {loading ? (
                <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Search className="size-5 shrink-0 text-muted-foreground" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { handleSearch(e.target.value); setActiveIndex(0) }}
                onKeyDown={onKeyDown}
                placeholder="Rechercher un employé, une anomalie, un log..."
                className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              {query && (
                <button onClick={() => { setQuery(""); setResults({ employes: [], anomalies: [], logs: [] }) }} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              )}
              <kbd className="hidden shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground/70 sm:inline">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Recherche en cours...
                </div>
              )}

              {showEmpty && (
                <div className="flex flex-col items-center py-8 text-sm text-muted-foreground">
                  <Search className="mb-2 size-8 opacity-40" />
                  Aucun résultat pour "{query}"
                </div>
              )}

              {!loading && hasResults && CATEGORIES.map((cat) => {
                const items = results[cat.key]
                if (items.length === 0) return null
                const Icon = cat.icon
                return (
                  <div key={cat.key}>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      <Icon className="size-3" />
                      {cat.label}
                      <span className="ml-auto text-[10px] font-normal lowercase text-muted-foreground/50">{items.length} résultat{items.length > 1 ? "s" : ""}</span>
                    </div>
                    {items.map((item: any, idx: number) => {
                      const globalIdx = flatResults.findIndex(
                        (f) => f.category === cat.key && f.item.id === item.id,
                      )
                      return (
                        <button
                          key={`${cat.key}-${item.id}`}
                          onClick={() => navigate(globalIdx)}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                            activeIndex === globalIdx ? "bg-muted" : "hover:bg-muted/50",
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-foreground">
                              {cat.key === "employes" ? `${item.prenom} ${item.nom}` : cat.key === "anomalies" ? item.type : item.action}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {cat.key === "employes" ? item.email : cat.key === "anomalies" ? item.description : item.details}
                            </span>
                          </div>
                          <ArrowRight className="size-3 shrink-0 text-muted-foreground/40" />
                        </button>
                      )
                    })}
                  </div>
                )
              })}

              {!loading && query.length < 2 && (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Tapez au moins 2 caractères pour lancer la recherche
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export { CommandSearch }
