"use client"

import { useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import toast from "react-hot-toast"
import { Badge } from "@/components/dashboard/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useModificationRequests, useProcessModification } from "@/lib/hooks/use-modification-requests"
import { useEmployees } from "@/lib/hooks/use-employees"
import { getNomComplet } from "@/lib/utils"
import { formatDateTime, formatHeure } from "@/lib/utils"
import { modificationStatutLabel } from "@/lib/labels"
import type { DemandeModification, SessionPresence } from "@/lib/types"

type RequestRow = DemandeModification & {
  employe?: { id: string; nom: string; prenom: string } | null
  session?: SessionPresence
}

export default function ModificationsPage() {
  const { user } = useAuth()
  const { data: requests = [], isLoading } = useModificationRequests()
  const { data: employees = [] } = useEmployees()
  const processModif = useProcessModification()

  const [statusFilter, setStatusFilter] = useState("all")
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [selectedAction, setSelectedAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null)

  const filtered = useMemo(
    () =>
      (requests as RequestRow[]).filter((request) =>
        (statusFilter === "all" || request.statut === statusFilter) &&
        (employeeFilter === "all" || request.employe?.id === employeeFilter)
      ),
    [employeeFilter, requests, statusFilter],
  )

  const columns: ColumnDef<RequestRow>[] = [
    {
      header: "Employé",
      accessorFn: (row) => (row.employe ? getNomComplet(row.employe) : "Employé"),
    },
    {
      header: "Session",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.session ? `${row.original.session.date} · ${formatHeure(row.original.session.heure_arrivee)}` : "—"}
        </span>
      ),
    },
    { header: "Modification proposée", accessorKey: "modification_proposee" },
    { header: "Raison", accessorKey: "raison" },
    {
      header: "Statut",
      accessorKey: "statut",
      cell: ({ row }) => (
        <Badge variant={row.original.statut === "validee" ? "success" : row.original.statut === "rejetee" ? "danger" : "warning"}>
          {modificationStatutLabel[row.original.statut] ?? row.original.statut}
        </Badge>
      ),
    },
    {
      header: "Date",
      accessorKey: "date_demande",
      enableSorting: true,
      cell: ({ row }) => formatDateTime(row.original.date_demande),
    },
    {
      header: "Actions",
      cell: ({ row }) => {
        if (user?.role !== "admin" && user?.role !== "gestionnaire") return <span className="text-sm text-muted-foreground">Lecture seule</span>
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedAction({ id: row.original.id, action: "approve" })}>Valider</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedAction({ id: row.original.id, action: "reject" })}>Rejeter</Button>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground"><Spinner /><span>Chargement des demandes...</span></div>
  }

  return (
    <div className="space-y-6">
      <Card className="grid gap-3 lg:grid-cols-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="all">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validée</option>
          <option value="rejetee">Rejetée</option>
        </select>
        <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="all">Tous les employés</option>
          {employees.map((employee: any) => (
            <option key={employee.id} value={employee.id}>{getNomComplet(employee)}</option>
          ))}
        </select>
      </Card>

      <DataTable columns={columns} data={filtered} />

      <Modal open={selectedAction !== null} onClose={() => setSelectedAction(null)}
        title={selectedAction?.action === "approve" ? "Valider la demande" : "Rejeter la demande"}
        description="Cette action met à jour le statut de la demande.">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSelectedAction(null)}>Annuler</Button>
          <Button variant={selectedAction?.action === "approve" ? "default" : "destructive"}
            onClick={async () => {
              if (!selectedAction) return
              try {
                await processModif.mutateAsync(selectedAction)
                toast.success(selectedAction.action === "approve" ? "Demande validée." : "Demande rejetée.")
              } catch { toast.error("Erreur lors du traitement.") }
              setSelectedAction(null)
            }}
            disabled={processModif.isPending}
          >Confirmer</Button>
        </div>
      </Modal>
    </div>
  )
}