"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/dashboard/avatar";
import { Badge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table";
import { api } from "@/lib/api";
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
  const [requests, setRequests] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getRequests().then((r) => { setRequests(r as Demande[]); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des demandes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Demandes</h2>
        <p className="text-sm text-muted-foreground">Valide ou refuse les demandes des employés.</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <p className="p-6 text-center text-sm text-muted-foreground">Aucune demande pour le moment.</p>
        </Card>
      ) : (
        <Card>
          <TableWrapper className="border-0">
            <Table>
              <thead className="bg-muted/50">
                <tr>
                  <TableHeadCell>Employé</TableHeadCell>
                  <TableHeadCell>Type</TableHeadCell>
                  <TableHeadCell>Début</TableHeadCell>
                  <TableHeadCell>Fin</TableHeadCell>
                  <TableHeadCell>Motif</TableHeadCell>
                  <TableHeadCell>Statut</TableHeadCell>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Actions</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nom={`${r.user.firstName} ${r.user.lastName}`} src={r.user.photoUrl} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.user.firstName} {r.user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{r.user.departement || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{TYPE_LABEL[r.type] || r.type}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.dateDebut ? formatDate(r.dateDebut) : "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.dateFin ? formatDate(r.dateFin) : "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{r.motif}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUT_VARIANT[r.statut]}>{STATUT_LABEL[r.statut]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(r.dateDemande)}</td>
                    <td className="px-4 py-3">
                      {r.statut === "en_attente" ? (
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-success text-success-foreground hover:bg-success"
                            onClick={async () => {
                              try {
                                await api.processRequest(r.id, "approve");
                                toast.success("Demande approuvée");
                                load();
                              } catch { toast.error("Erreur"); }
                            }}
                          >
                            <CheckCircle2 className="size-4" />
                            Approuver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive text-destructive-foreground hover:bg-destructive"
                            onClick={async () => {
                              try {
                                await api.processRequest(r.id, "reject");
                                toast.success("Demande refusée");
                                load();
                              } catch { toast.error("Erreur"); }
                            }}
                          >
                            <XCircle className="size-4" />
                            Refuser
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {r.traiteePar ? "Traité" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        </Card>
      )}
    </div>
  );
}
