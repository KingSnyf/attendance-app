"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, TrendingDown, AlertTriangle, Clock, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/dashboard/avatar";
import { Badge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table";
import { api } from "@/lib/api";
import { exporterVersCSV, telechargerCSV } from "@/lib/utils";

type MoisData = {
  mois: number; annee: number; totalSessions: number; sessionsAvecRetard: number; sessionsAvecDepart: number;
  tempsPresenceHeures: number; heuresSupplementairesHeures: number; moyenneHeuresParJour: number;
  joursOuvres: number; joursTravailles: number; tauxPresence: number; utilisateursActifs: number;
}

type EmployeeStat = {
  id: string; nom: string; prenom: string; photo_url: string | null; departement: string;
  totalSessions: number; totalHeures: number; moyenneHeuresParJour: number;
  retards: number; joursPresence: number; joursOuvres: number; tauxPresence: number;
}

const MOIS_NOMS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
const NOW = new Date();

export default function RapportMensuelPage() {
  const [year, setYear] = useState(NOW.getFullYear());
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [data, setData] = useState<MoisData[]>([]);
  const [employeeData, setEmployeeData] = useState<{ topPresent: EmployeeStat[]; topAbsent: EmployeeStat[]; employeeStats: EmployeeStat[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getMonthlyStats(year) as Promise<MoisData[]>,
      api.getMonthlyEmployeeStats(year, month) as Promise<any>,
    ]).then(([stats, emp]) => {
      setData(stats);
      setEmployeeData(emp);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year, month]);

  const totalAnnuel = useMemo(() => {
    if (data.length === 0) return null;
    return {
      totalSessions: data.reduce((s, m) => s + m.totalSessions, 0),
      totalRetards: data.reduce((s, m) => s + m.sessionsAvecRetard, 0),
      totalHeuresPresence: data.reduce((s, m) => s + m.tempsPresenceHeures, 0),
      totalHeuresSup: data.reduce((s, m) => s + m.heuresSupplementairesHeures, 0),
      totalJoursTravailles: data.reduce((s, m) => s + m.joursTravailles, 0),
    };
  }, [data]);

  const moisCourant = data.find((m) => m.mois === month);

  const handleExport = () => {
    const lignes = data.map((m) => ({
      mois: MOIS_NOMS[m.mois - 1], annee: m.annee, sessions: m.totalSessions,
      retards: m.sessionsAvecRetard, "jours travaillés": m.joursTravailles,
      "jours ouvrés": m.joursOuvres, "taux présence %": `${m.tauxPresence}%`,
      "heures présence": `${m.tempsPresenceHeures}h`, "moyenne h/jour": `${m.moyenneHeuresParJour}h`,
      "heures sup": `${m.heuresSupplementairesHeures}h`,
    }));
    telechargerCSV(`rapport-mensuel-${year}.csv`, exporterVersCSV(lignes));
    toast.success("Export CSV généré.");
  };

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement du rapport mensuel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Rapport mensuel</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyse des présences, retards et tendances.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          >
            {MOIS_NOMS.map((nom, i) => (
              <option key={i} value={i + 1}>{nom}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={handleExport}>
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* CARTES DU MOIS SÉLECTIONNÉ */}
      {moisCourant && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Clock className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Sessions</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{moisCourant.totalSessions}</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="size-4 text-warning-foreground" />
              <span className="text-[10px] uppercase tracking-wider">Retards</span>
            </div>
            <p className="text-2xl font-bold text-warning-foreground">{moisCourant.sessionsAvecRetard}</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="size-4 text-brand" />
              <span className="text-[10px] uppercase tracking-wider">Présence</span>
            </div>
            <p className="text-2xl font-bold text-brand">{moisCourant.tempsPresenceHeures.toFixed(1)}h</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="size-4 text-signal" />
              <span className="text-[10px] uppercase tracking-wider">Heures sup.</span>
            </div>
            <p className="text-2xl font-bold text-signal">{moisCourant.heuresSupplementairesHeures.toFixed(1)}h</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <UserCheck className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Taux présence</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{moisCourant.tauxPresence}%</p>
            <p className="text-[10px] text-muted-foreground">{moisCourant.joursTravailles}/{moisCourant.joursOuvres} jours</p>
          </Card>
        </div>
      )}

      {/* TOP 5 PRÉSENTS / ABSENTS */}
      {employeeData && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-5 text-brand" />
              <h3 className="text-sm font-semibold text-foreground">Top 5 — Plus présents</h3>
            </div>
            <div className="space-y-3">
              {employeeData.topPresent.map((emp, i) => (
                <div key={emp.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  <Avatar nom={`${emp.prenom} ${emp.nom}`} src={emp.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{emp.prenom} {emp.nom}</p>
                    <p className="text-[11px] text-muted-foreground">{emp.departement}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-brand">{emp.totalHeures.toFixed(1)}h</p>
                    <p className="text-[10px] text-muted-foreground">{emp.totalSessions} sessions</p>
                  </div>
                </div>
              ))}
              {employeeData.topPresent.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune donnée ce mois-ci.</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="size-5 text-warning-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Top 5 — Moins présents</h3>
            </div>
            <div className="space-y-3">
              {employeeData.topAbsent.map((emp, i) => (
                <div key={emp.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  <Avatar nom={`${emp.prenom} ${emp.nom}`} src={emp.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{emp.prenom} {emp.nom}</p>
                    <p className="text-[11px] text-muted-foreground">{emp.departement}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-warning-foreground">{emp.totalHeures.toFixed(1)}h</p>
                    <p className="text-[10px] text-muted-foreground">{emp.tauxPresence}% présence</p>
                  </div>
                </div>
              ))}
              {employeeData.topAbsent.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune donnée ce mois-ci.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* GRAPHIQUE ÉVOLUTION ANNUELLE */}
      {data.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Évolution annuelle des heures de présence
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey={(d) => MOIS_NOMS[d.mois - 1].slice(0, 3)} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toFixed(1)}h`, "Heures"]}
                  labelFormatter={(i: any) => MOIS_NOMS[data[Number(i)]?.mois - 1] || ""}
                />
                <Bar dataKey="tempsPresenceHeures" fill="var(--color-brand, #6366f1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* TABLEAU DÉTAILLÉ PAR MOIS */}
      <Card>
        <TableWrapper className="border-0">
          <Table>
            <thead className="bg-muted/50">
              <tr>
                <TableHeadCell>Mois</TableHeadCell>
                <TableHeadCell>Sessions</TableHeadCell>
                <TableHeadCell>Retards</TableHeadCell>
                <TableHeadCell>Jours travaillés</TableHeadCell>
                <TableHeadCell>Jours ouvrés</TableHeadCell>
                <TableHeadCell>Taux présence</TableHeadCell>
                <TableHeadCell>Heures présence</TableHeadCell>
                <TableHeadCell>Moy. h/jour</TableHeadCell>
                <TableHeadCell>Heures sup.</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.mois} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{MOIS_NOMS[m.mois - 1]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.totalSessions}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.sessionsAvecRetard > 0 ? "warning" : "success"}>
                      {m.sessionsAvecRetard}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.joursTravailles}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.joursOuvres}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.tauxPresence >= 80 ? "success" : m.tauxPresence >= 50 ? "warning" : "danger"}>
                      {m.tauxPresence}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.tempsPresenceHeures.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.moyenneHeuresParJour.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.heuresSupplementairesHeures > 0 ? (
                      <span className="font-medium text-warning-foreground">{m.heuresSupplementairesHeures.toFixed(1)}h</span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      </Card>
    </div>
  );
}