// app/(dashboard)/dashboard/modifications/page.tsx
// Liste des demandes de modification avec workflow de validation administrateur.

"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getNomComplet } from "@/lib/data";
import type { DemandeModification, SessionPresence, Utilisateur } from "@/lib/types";
import { formatDateTime, formatHeure } from "@/lib/utils";
import { modificationStatutLabel } from "@/lib/labels";

type RequestRow = DemandeModification & {
  employe?: { id: string; nom: string; prenom: string } | null;
  session?: SessionPresence;
};

export default function ModificationsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [employees, setEmployees] = useState<Utilisateur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [selectedAction, setSelectedAction] = useState<{
    id: string;
    action: "approve" | "reject";
  } | null>(null);

  useEffect(() => {
    api.getModificationRequests().then((result) => {
      setRequests(result as RequestRow[]);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
    api.getEmployees().then(setEmployees).catch(() => setEmployees([]));
  }, []);

  const filtered = useMemo(
    () =>
      requests.filter((request) => {
        return (
          (statusFilter === "all" || request.statut === statusFilter) &&
          (employeeFilter === "all" || request.employe?.id === employeeFilter)
        );
      }),
    [employeeFilter, requests, statusFilter],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des demandes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="grid gap-3 lg:grid-cols-2">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validée</option>
          <option value="rejetee">Rejetée</option>
        </select>

        <select
          value={employeeFilter}
          onChange={(event) => setEmployeeFilter(event.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="all">Tous les employés</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {getNomComplet(employee)}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <TableWrapper className="border-0">
          <Table>
            <thead className="bg-muted/50">
              <tr>
                <TableHeadCell>Employé</TableHeadCell>
                <TableHeadCell>Session</TableHeadCell>
                <TableHeadCell>Modification proposée</TableHeadCell>
                <TableHeadCell>Raison</TableHeadCell>
                <TableHeadCell>Statut</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => (
                <tr key={request.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    {request.employe ? getNomComplet(request.employe) : "Employé"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {request.session
                      ? `${request.session.date} · ${formatHeure(request.session.heure_arrivee)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {request.modification_proposee}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{request.raison}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        request.statut === "validee"
                          ? "success"
                          : request.statut === "rejetee"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {modificationStatutLabel[request.statut] ?? request.statut}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(request.date_demande)}
                  </td>
                  <td className="px-4 py-3">
                    {user?.role === "admin" ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAction({ id: request.id, action: "approve" })}
                        >
                          Valider
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAction({ id: request.id, action: "reject" })}
                        >
                          Rejeter
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Lecture seule</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      </Card>

      <Modal
        open={selectedAction !== null}
        onClose={() => setSelectedAction(null)}
        title={
          selectedAction?.action === "approve"
            ? "Valider la demande"
            : "Rejeter la demande"
        }
        description="Cette action met à jour le statut de la demande."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSelectedAction(null)}>
            Annuler
          </Button>
          <Button
            variant={selectedAction?.action === "approve" ? "default" : "destructive"}
              onClick={async () => {
                if (!selectedAction) return;
                const { id, action } = selectedAction;
                if (action === "approve") {
                  await api.approveRequest(id);
                  toast.success("Demande validée.");
                } else {
                  await api.rejectRequest(id);
                  toast.success("Demande rejetée.");
                }
                setSelectedAction(null);
                api.getModificationRequests().then((result) => {
                  setRequests(result as RequestRow[]);
                }).catch(() => {});
              }}
          >
            Confirmer
          </Button>
        </div>
      </Modal>
    </div>
  );
}