// app/(dashboard)/dashboard/anomalies/page.tsx
// Gestion centralisée des anomalies avec filtres, traitement et vue géolocalisée.

"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPinned, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/dashboard/status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { useAnomalies, useResolveAnomaly } from "@/lib/hooks/use-anomalies";
import { useEmployees } from "@/lib/hooks/use-employees";
import { getNomComplet } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Anomalie } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { anomalieTypeLabel } from "@/lib/labels";

export default function AnomaliesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [geoOnly, setGeoOnly] = useState(false);
  const [selected, setSelected] = useState<Anomalie | null>(null);
  const [comment, setComment] = useState("");
  const [geolocVerified, setGeolocVerified] = useState(false);

  const { data: anomalies = [], isLoading, error } = useAnomalies();
  const { data: employees = [] } = useEmployees();
  const resolveMutation = useResolveAnomaly();

  const stats = useMemo(() => {
    const total = anomalies.length;
    const traitees = anomalies.filter((a) => a.traitee).length;
    return {
      nonTraitees: total - traitees,
      geofencing: anomalies.filter((a) => a.type === "geofencing_incoherent").length,
      critiques: anomalies.filter((a) => a.criticite === "critique").length,
      tauxResolution: total > 0 ? Math.round((traitees / total) * 100) : 0,
    };
  }, [anomalies]);

  const filtered = useMemo(
    () =>
      anomalies.filter((anomalie) => {
        return (
          (statusFilter === "all" ||
            (statusFilter === "traitee" ? anomalie.traitee : statusFilter === "non_traitee" ? !anomalie.traitee : true)) &&
          (typeFilter === "all" || anomalie.type === typeFilter) &&
          (employeeFilter === "all" || anomalie.user_id === employeeFilter) &&
          (!geoOnly || anomalie.type === "geofencing_incoherent")
        );
      }),
    [anomalies, employeeFilter, geoOnly, statusFilter, typeFilter],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center gap-3 text-[#7d8496]">
        <Spinner />
        <span>Chargement des anomalies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <p className="text-sm text-[#93000a]">Erreur lors du chargement des anomalies.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-362.5 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] text-[#8a91a3]">Tableau de bord / Anomalies</p>
          <h1 className="text-lg font-semibold text-[#111a35]">Anomalies</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={AlertTriangle} label="Non traitées" value={stats.nonTraitees} variant="danger" />
        <StatCard icon={MapPinned} label="Écarts géofencing" value={stats.geofencing} variant="info" />
        <StatCard icon={ShieldCheck} label="Criticité élevée" value={stats.critiques} variant="warning" />
        <StatCard icon={CheckCircle2} label="Taux de résolution" value={`${stats.tauxResolution}%`} variant="success" />
      </div>

      <Card className="grid gap-3 lg:grid-cols-4">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-9 rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px] text-[#454d61]"
        >
          <option value="all">Tous les statuts</option>
          <option value="non_traitee">Non traitées</option>
          <option value="traitee">Traitées</option>
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="h-9 rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px] text-[#454d61]"
        >
          <option value="all">Tous les types</option>
          <option value="device_different">Appareil différent</option>
          <option value="double_badge">Double badge</option>
          <option value="hors_reseau">Hors réseau</option>
          <option value="geofencing_incoherent">Géofencing</option>
        </select>
        <select
          value={employeeFilter}
          onChange={(event) => setEmployeeFilter(event.target.value)}
          className="h-9 rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px] text-[#454d61]"
        >
          <option value="all">Tous les employés</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {getNomComplet(employee)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-md border border-[#dfe3e9] px-3 h-9">
          <input
            type="checkbox"
            checked={geoOnly}
            onChange={(event) => setGeoOnly(event.target.checked)}
          />
          <span className="text-[11px] text-[#454d61]">Seulement géofencing</span>
        </label>
      </Card>

      <Card>
        <DataTable
          columns={[
            { accessorKey: "type", header: "Type", enableSorting: true, cell: ({ row }) => anomalieTypeLabel[row.original.type] ?? row.original.type },
            { accessorKey: "score", header: "Criticité", enableSorting: true, cell: ({ row }) => {
              const a = row.original;
              return a.criticite ? (
                <Badge variant={a.criticite === 'critique' ? 'danger' : a.criticite === 'moyen' ? 'warning' : 'info'}>
                  {a.criticite === 'critique' ? 'Critique' : a.criticite === 'moyen' ? 'Moyen' : 'Faible'}
                </Badge>
              ) : <span className="text-[#8a91a3]">—</span>;
            }},
            { accessorKey: "employe", header: "Employé", enableSorting: true, cell: ({ row }) => row.original.employe ? getNomComplet(row.original.employe) : "Inconnu" },
            { accessorKey: "description", header: "Description", enableSorting: false, cell: ({ row }) => row.original.description },
            { accessorKey: "date_detection", header: "Date", enableSorting: true, cell: ({ row }) => formatDateTime(row.original.date_detection) },
            { accessorKey: "traitee", header: "Statut", enableSorting: true, cell: ({ row }) => (
              <Badge variant={row.original.traitee ? "success" : "danger"}>
                {row.original.traitee ? "Traitée" : "Non traitée"}
              </Badge>
            )},
            { accessorKey: "geoloc_verifiee", header: "Géoloc", enableSorting: true, cell: ({ row }) => row.original.geoloc_verifiee ? "Oui" : "Non" },
            { id: "actions", header: "Actions", enableSorting: false, cell: ({ row }) => {
              const a = row.original;
              return a.traitee ? null : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelected(a)}>
                    <ShieldCheck className="size-4" /> Traiter
                  </Button>
                </div>
              );
            }},
          ]}
          data={filtered}
          pageSize={10}
        />
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Traiter une anomalie"
        description="Ajoutez un commentaire et confirmez le contrôle géolocalisé."
      >
        <div className="space-y-4">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="min-h-28 w-full rounded-md border border-[#dfe3e9] bg-white p-3 text-[11px] text-[#454d61] outline-none focus:border-[#5363dc]"
            placeholder="Commentaire de traitement"
          />
          <label className="flex items-center gap-2 text-[11px] text-[#454d61]">
            <input
              type="checkbox"
              checked={geolocVerified}
              onChange={(event) => setGeolocVerified(event.target.checked)}
            />
            Vérification géoloc effectuée
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!selected) return;
                resolveMutation.mutate(
                  { id: selected.id, comment, geolocVerified },
                  { onSuccess: () => { setSelected(null); setComment(""); setGeolocVerified(false); } },
                );
              }}
            >
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}