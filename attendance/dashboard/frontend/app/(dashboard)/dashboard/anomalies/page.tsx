// app/(dashboard)/dashboard/anomalies/page.tsx
// Gestion centralisée des anomalies avec filtres, traitement et vue géolocalisée.

"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPinned } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table";
import { api } from "@/lib/api";
import { getNomComplet, utilisateurs } from "@/lib/data";
import type { Anomalie } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [geoOnly, setGeoOnly] = useState(false);
  const [selected, setSelected] = useState<Anomalie | null>(null);
  const [comment, setComment] = useState("");
  const [geolocVerified, setGeolocVerified] = useState(false);

  useEffect(() => {
    api.getAnomalies().then((result) => {
      setAnomalies(result);
      setIsLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () =>
      anomalies.filter((anomalie) => {
        return (
          (statusFilter === "all" ||
            (statusFilter === "traitee" ? anomalie.traitee : !anomalie.traitee)) &&
          (typeFilter === "all" || anomalie.type === typeFilter) &&
          (employeeFilter === "all" || anomalie.user_id === employeeFilter) &&
          (!geoOnly || anomalie.type === "geofencing_incoherent")
        );
      }),
    [anomalies, employeeFilter, geoOnly, statusFilter, typeFilter],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des anomalies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="grid gap-3 lg:grid-cols-4">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="non_traitee">Non traitées</option>
          <option value="traitee">Traitées</option>
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
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
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="all">Tous les employés</option>
          {utilisateurs.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {getNomComplet(employee)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-border px-3">
          <input
            type="checkbox"
            checked={geoOnly}
            onChange={(event) => setGeoOnly(event.target.checked)}
          />
          <span className="text-sm text-foreground">Seulement géofencing</span>
        </label>
      </Card>

      <Card>
        <TableWrapper className="border-0">
          <Table>
            <thead className="bg-muted/50">
              <tr>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Employé</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Statut</TableHeadCell>
                <TableHeadCell>Géoloc vérifiée</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {filtered.map((anomalie) => {
                const user = utilisateurs.find((item) => item.id === anomalie.user_id);
                return (
                  <tr key={anomalie.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{anomalie.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user ? getNomComplet(user) : "Inconnu"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{anomalie.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(anomalie.date_detection)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={anomalie.traitee ? "success" : "danger"}>
                        {anomalie.traitee ? "Traitée" : "Non traitée"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {anomalie.geoloc_verifiee ? "Oui" : "Non"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected(anomalie)}
                        >
                          Marquer traitée
                        </Button>
                        {anomalie.type === "geofencing_incoherent" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toast.success("Vue carte simulée depuis la fiche employé.")
                            }
                          >
                            <MapPinned className="size-4" />
                            Voir sur la carte
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrapper>
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
            className="min-h-28 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-brand"
            placeholder="Commentaire de traitement"
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
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
              onClick={async () => {
                if (!selected) return;
                await api.resolveAnomaly(selected.id, comment, geolocVerified);
                toast.success("Anomalie traitée pour la démonstration.");
                setSelected(null);
                setComment("");
                setGeolocVerified(false);
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
