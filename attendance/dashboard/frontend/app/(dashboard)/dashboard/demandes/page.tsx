"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar } from "@/components/dashboard/avatar";
import { Badge } from "@/components/dashboard/status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { useRequests, useProcessRequest } from "@/lib/hooks/use-requests";
import { formatDate } from "@/lib/utils";

type Demande = {
  id: string
  userId: string
  type: string
  dateDebut: string | null
  dateFin: string | null
  motif: string
  statut: string
  traiteePar: string | null
  dateDemande: string
  dateTraitement: string | null
  commentaire: string | null
  user: { id: string; firstName: string; lastName: string; email: string; photoUrl: string | null; departement: string | null }
}

const TYPE_LABEL: Record<string, string> = { absence: "Absence", autre: "Autre" }
const STATUT_LABEL: Record<string, string> = { en_attente: "En attente", approuve: "Approuvé", refuse: "Refusé" }
const STATUT_VARIANT: Record<string, "warning" | "success" | "danger"> = { en_attente: "warning", approuve: "success", refuse: "danger" }

export default function DemandesPage() {
  const { data: requestsData, isLoading, error } = useRequests();
  const processMutation = useProcessRequest();
  const requests = (requestsData as Demande[]) ?? [];
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

  const stats = useMemo(
    () => ({
      total: requests.length,
      enAttente: requests.filter((r) => r.statut === "en_attente").length,
      approuvees: requests.filter((r) => r.statut === "approuve").length,
      refusees: requests.filter((r) => r.statut === "refuse").length,
    }),
    [requests],
  );

  const handleConfirm = () => {
    if (!confirmTarget) return;
    processMutation.mutate(
      { id: confirmTarget.id, action: confirmTarget.action },
      { onSuccess: () => setConfirmTarget(null) },
    );
  };

  const columns: ColumnDef<Demande>[] = [
    {
      header: "Employé",
      accessorKey: "user.firstName",
      enableSorting: true,
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <div className="flex items-center gap-3">
            <Avatar nom={`${u.firstName} ${u.lastName}`} src={u.photoUrl} size="sm" />
            <div>
              <p className="text-sm font-medium text-foreground">{u.firstName} {u.lastName}</p>
              <p className="text-xs text-muted-foreground">{u.departement || ""}</p>
            </div>
          </div>
        );
      },
    },
    { header: "Type", accessorKey: "type", enableSorting: true, cell: ({ row }) => TYPE_LABEL[row.original.type] || row.original.type },
    { header: "Début", accessorKey: "dateDebut", enableSorting: true, cell: ({ row }) => row.original.dateDebut ? formatDate(row.original.dateDebut) : "—" },
    { header: "Fin", accessorKey: "dateFin", enableSorting: true, cell: ({ row }) => row.original.dateFin ? formatDate(row.original.dateFin) : "—" },
    { header: "Motif", accessorKey: "motif", enableSorting: false, cell: ({ row }) => <span className="max-w-xs truncate block">{row.original.motif}</span> },
    { header: "Statut", accessorKey: "statut", enableSorting: true, cell: ({ row }) => <Badge variant={STATUT_VARIANT[row.original.statut]}>{STATUT_LABEL[row.original.statut]}</Badge> },
    { header: "Date", accessorKey: "dateDemande", enableSorting: true, cell: ({ row }) => formatDate(row.original.dateDemande) },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return r.statut === "en_attente" ? (
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="border-success text-success-foreground hover:bg-success" onClick={() => setConfirmTarget({ id: r.id, action: "approve" })}>
              <CheckCircle2 className="size-4" /> Approuver
            </Button>
            <Button variant="outline" size="sm" className="border-destructive text-destructive-foreground hover:bg-destructive" onClick={() => setConfirmTarget({ id: r.id, action: "reject" })}>
              <XCircle className="size-4" /> Refuser
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{r.traiteePar ? "Traité" : "—"}</span>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des demandes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="text-sm text-destructive">Erreur lors du chargement des demandes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Demandes</h2>
        <p className="mt-1 text-sm text-muted-foreground">Valide ou refuse les demandes des employés.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Total demandes" value={stats.total} variant="info" />
        <StatCard icon={Clock} label="En attente" value={stats.enAttente} variant="warning" />
        <StatCard icon={CheckCircle2} label="Approuvées" value={stats.approuvees} variant="success" />
        <StatCard icon={XCircle} label="Refusées" value={stats.refusees} variant="danger" />
      </div>

      <Card>
        <DataTable columns={columns} data={requests} pageSize={10} />
      </Card>

      <Modal
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        title={confirmTarget?.action === "approve" ? "Approuver la demande" : "Refuser la demande"}
        description={`Êtes-vous sûr de vouloir ${confirmTarget?.action === "approve" ? "approuver" : "refuser"} cette demande ?`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setConfirmTarget(null)}>Annuler</Button>
          <Button
            variant={confirmTarget?.action === "approve" ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={processMutation.isPending}
          >
            {confirmTarget?.action === "approve" ? "Approuver" : "Refuser"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
