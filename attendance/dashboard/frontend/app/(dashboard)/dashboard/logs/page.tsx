// app/(dashboard)/dashboard/logs/page.tsx
// Journal d'activité administrateur avec filtres et export CSV.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getNomComplet, utilisateurs } from "@/lib/data";
import type { JournalActivite } from "@/lib/types";
import { exporterVersCSV, formatDateTime, telechargerCSV } from "@/lib/utils";

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<JournalActivite[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorFilter, setAuthorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    api.getLogs().then((result) => {
      setLogs(result as JournalActivite[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        const date = new Date(log.date);
        return (
          (authorFilter === "all" || log.auteur_id === authorFilter) &&
          (actionFilter === "all" || log.type_action === actionFilter) &&
          (!from || date >= new Date(from)) &&
          (!to || date <= new Date(to))
        );
      }),
    [actionFilter, authorFilter, from, logs, to],
  );

  const handleExport = () => {
    const csv = exporterVersCSV(
      filtered.map((log) => ({
        auteur:
          utilisateurs.find((item) => item.id === log.auteur_id)
            ? getNomComplet(utilisateurs.find((item) => item.id === log.auteur_id)!)
            : log.auteur_id,
        action: log.action,
        cible: log.cible,
        details: log.details,
        date: formatDateTime(log.date),
      })),
    );
    telechargerCSV("logs-activite.csv", csv);
    toast.success("Export des logs généré.");
  };

  if (user?.role !== "admin") {
    return <Card>Accès réservé aux administrateurs.</Card>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="grid gap-3 lg:grid-cols-4">
        <select
          value={authorFilter}
          onChange={(event) => setAuthorFilter(event.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="all">Tous les auteurs</option>
          {utilisateurs.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {getNomComplet(employee)}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="all">Tous les types</option>
          <option value="creation">Création</option>
          <option value="modification">Modification</option>
          <option value="validation">Validation</option>
          <option value="securite">Sécurité</option>
          <option value="export">Export</option>
        </select>

        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleExport}>
          <Download className="size-4" />
          Export des logs en CSV
        </Button>
      </div>

      <Card>
        <TableWrapper className="border-0">
          <Table>
            <thead className="bg-muted/50">
              <tr>
                <TableHeadCell>Auteur</TableHeadCell>
                <TableHeadCell>Action</TableHeadCell>
                <TableHeadCell>Cible</TableHeadCell>
                <TableHeadCell>Détails</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const auteur = utilisateurs.find((item) => item.id === log.auteur_id);
                return (
                  <tr key={log.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">
                      {auteur ? getNomComplet(auteur) : log.auteur_id}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.cible}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.details}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(log.date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrapper>
      </Card>
    </div>
  );
}
