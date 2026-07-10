"use client"

import { useMemo, useState } from "react"
import { Activity, Clock, Download, ShieldAlert, Settings2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import toast from "react-hot-toast"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useLogs } from "@/lib/hooks/use-logs"
import { useEmployees } from "@/lib/hooks/use-employees"
import { getNomComplet } from "@/lib/data"
import type { JournalActivite } from "@/lib/types"
import { exporterVersCSV, formatDateTime, formatHeure, telechargerCSV } from "@/lib/utils"

const COLONNES_EXPORT = [
  { key: "auteur", label: "Auteur" },
  { key: "action", label: "Action" },
  { key: "cible", label: "Cible" },
  { key: "details", label: "Détails" },
  { key: "date", label: "Date" },
] as const

export default function LogsPage() {
  const { user } = useAuth()
  const { data: logs = [], isLoading } = useLogs()
  const { data: employees = [] } = useEmployees()

  const [authorFilter, setAuthorFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [exportOpen, setExportOpen] = useState(false)
  const [colonnes, setColonnes] = useState<string[]>(COLONNES_EXPORT.map((c) => c.key))

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const aujourdhui = logs.filter((log: JournalActivite) => new Date(log.date).toDateString() === today).length
    const securite = logs.filter((log: JournalActivite) => log.type_action === "securite").length
    const derniere = logs.length
      ? logs.reduce((latest: JournalActivite, log: JournalActivite) =>
          new Date(log.date) > new Date(latest.date) ? log : latest, logs[0])
      : null
    return { total: logs.length, aujourdhui, securite, derniere }
  }, [logs])

  const filtered = useMemo(
    () =>
      logs.filter((log: JournalActivite) => {
        const date = new Date(log.date)
        return (
          (authorFilter === "all" || log.auteur_id === authorFilter) &&
          (actionFilter === "all" || log.type_action === actionFilter) &&
          (!from || date >= new Date(from)) &&
          (!to || date <= new Date(to + 'T23:59:59.999'))
        )
      }),
    [actionFilter, authorFilter, from, logs, to],
  )

  const handleExport = () => {
    const lignes = filtered.map((log: JournalActivite) => {
      const row: Record<string, string> = {}
      if (colonnes.includes("auteur")) row["Auteur"] = log.auteur ?? log.auteur_id
      if (colonnes.includes("action")) row["Action"] = log.action
      if (colonnes.includes("cible")) row["Cible"] = log.cible
      if (colonnes.includes("details")) row["Détails"] = log.details
      if (colonnes.includes("date")) row["Date"] = formatDateTime(log.date)
      return row
    })
    const csv = exporterVersCSV(lignes)
    telechargerCSV("logs-activite.csv", csv)
    toast.success(`Export généré (${lignes.length} lignes).`)
    setExportOpen(false)
  }

  const columns: ColumnDef<JournalActivite>[] = [
    { header: "Auteur", accessorFn: (row) => row.auteur ?? row.auteur_id },
    { header: "Action", accessorKey: "action" },
    { header: "Cible", accessorFn: (row) => row.cible || "—" },
    { header: "Détails", accessorFn: (row) => row.details || "—" },
    { header: "Date", accessorKey: "date", enableSorting: true, cell: ({ row }) => formatDateTime(row.original.date) },
  ]

  if (user?.role !== "admin") {
    return <Card>Accès réservé aux administrateurs.</Card>
  }

  if (isLoading) {
    return <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground"><Spinner /><span>Chargement des logs...</span></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Journal d'activité
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Historique des actions administratives sur la plateforme.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Activity} label="Total actions" value={stats.total} variant="info" />
        <StatCard icon={Clock} label="Aujourd'hui" value={stats.aujourdhui} variant="success" />
        <StatCard icon={ShieldAlert} label="Actions sécurité" value={stats.securite} variant="warning" />
        <StatCard
          icon={Clock}
          label="Dernière action"
          value={stats.derniere ? formatHeure(stats.derniere.date) : "—"}
          variant="info"
        />
      </div>

      <Card className="grid gap-3 lg:grid-cols-4">
        <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="all">Tous les auteurs</option>
          {employees.map((employee: any) => (
            <option key={employee.id} value={employee.id}>{getNomComplet(employee)}</option>
          ))}
        </select>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="all">Tous les types</option>
          <option value="creation">Création</option>
          <option value="modification">Modification</option>
          <option value="validation">Validation</option>
          <option value="securite">Sécurité</option>
          <option value="export">Export</option>
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setExportOpen(true)}><Settings2 className="size-4" /> Export CSV</Button>
      </div>

      <DataTable columns={columns} data={filtered} />

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Export CSV — choisir les colonnes"
        description="Sélectionnez les colonnes à inclure dans le fichier exporté.">
        <div className="space-y-3">
          {COLONNES_EXPORT.map((col) => (
            <label key={col.key} className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={colonnes.includes(col.key)}
                onChange={(e) => { setColonnes(e.target.checked ? [...colonnes, col.key] : colonnes.filter((c) => c !== col.key)) }} />
              {col.label}
            </label>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setExportOpen(false)}>Annuler</Button>
            <Button onClick={handleExport} disabled={colonnes.length === 0}>
              <Download className="size-4" /> Exporter ({filtered.length} lignes)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}