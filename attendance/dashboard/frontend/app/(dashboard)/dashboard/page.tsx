// app/(dashboard)/dashboard/page.tsx
// Vue d'ensemble du système avec KPI, alertes GPS, graphique et tableau des employés.

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Coffee, Download, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { EmployeesPresence } from "@/components/dashboard/employeesPresence";
import { GeofencingAlert } from "@/components/dashboard/geofencing-alert";
import { PresenceChart } from "@/components/dashboard/presence-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDashboardData } from "@/lib/hooks/use-dashboard-data";
import { exporterVersCSV, formatDuree, formatHeure, telechargerCSV } from "@/lib/utils";
import { api } from "@/lib/api";

export default function VueEnsemblePage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useDashboardData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartement, setFilterDepartement] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterGeofencing, setFilterGeofencing] = useState("all");
  const [period, setPeriod] = useState<"semaine" | "mois">("semaine");

  const departements = useMemo(() => {
    const uniques = new Set(
      (data?.employees ?? [])
        .map((employee) => employee.departement)
        .filter((departement): departement is string => Boolean(departement)),
    );
    return Array.from(uniques).sort();
  }, [data?.employees]);

  const employees = useMemo(() => {
    return (data?.employees ?? [])
      .map((employee) => ({
        ...employee,
        premiere_arrivee: employee.premiere_arrivee ? formatHeure(employee.premiere_arrivee) : null,
        temps_cumule: formatDuree(employee.temps_cumule_minutes),
        geofencing_alert: data?.geofencingAlerts.some(
          (alert) => alert.user_id === employee.id,
        ),
      }))
      .filter((employee) => {
        const search = searchQuery.toLowerCase().trim();
        return (
          (!search ||
            `${employee.prenom} ${employee.nom}`.toLowerCase().includes(search) ||
            employee.email.toLowerCase().includes(search)) &&
          (filterDepartement === "all" || employee.departement === filterDepartement) &&
          (filterStatut === "all" || employee.statut_actuel === filterStatut) &&
          (filterGeofencing === "all" ||
            (filterGeofencing === "alert"
              ? employee.geofencing_alert
              : !employee.geofencing_alert))
        );
      });
  }, [data?.employees, data?.geofencingAlerts, filterDepartement, filterGeofencing, filterStatut, searchQuery]);

  const handleExportCSV = () => {
    const csv = exporterVersCSV(
      employees.map((employee) => ({
        nom: `${employee.prenom} ${employee.nom}`,
        email: employee.email,
        departement: employee.departement,
        statut: employee.statut_actuel,
        arrivee: employee.premiere_arrivee ?? "—",
        temps_cumule: employee.temps_cumule ?? "—",
      })),
    );
    telechargerCSV("employees-dashboard.csv", csv);
    toast.success("Export CSV généré avec succès.");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des données du dashboard...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <p className="font-medium text-foreground">
          Impossible de charger les données du dashboard.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <GeofencingAlert
        anomalies_geofencing={data.geofencingAlerts}
        users={data.employees}
        onVerify={async () => {
          await Promise.all(
            data.geofencingAlerts.map((alert) =>
              api.resolveAnomaly(alert.id, "Vérifiée depuis le tableau de bord", true),
            ),
          );
          toast.success("Alerte(s) géofencing marquée(s) comme vérifiée(s).");
          refetch();
        }}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Présents"
          value={data.stats.presents}
          variant="success"
        />
        <StatCard
          icon={XCircle}
          label="Absents"
          value={data.stats.absents}
          variant="danger"
        />
        <StatCard
          icon={Coffee}
          label="En pause"
          value={data.stats.enPause}
          variant="warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="Anomalies"
          value={data.stats.anomaliesNonTraitees}
          variant="info"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Présence collective</h2>
          <p className="text-sm text-muted-foreground">
            Comparez la semaine en cours et la tendance mensuelle.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === "semaine" ? "default" : "outline"}
            onClick={() => setPeriod("semaine")}
            size="sm"
          >
            Semaine
          </Button>
          <Button
            variant={period === "mois" ? "default" : "outline"}
            onClick={() => setPeriod("mois")}
            size="sm"
          >
            Mois
          </Button>
        </div>
      </div>

      <PresenceChart
        data={period === "semaine" ? data.weeklyPresence : data.monthlyPresence}
        period={period}
      />

      <Card>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Présence des employés</h2>
            <p className="text-sm text-muted-foreground">
              Statut en temps réel, appareil associé et temps cumulé du jour.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-44 lg:w-52"
            />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm"
            >
              <option value="all">Tous</option>
              <option value="present">Présent</option>
              <option value="en_attente">En pause</option>
              <option value="absent">Absent</option>
            </select>
            <select
              value={filterDepartement}
              onChange={(e) => setFilterDepartement(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm"
            >
              <option value="all">Tous les dép.</option>
              {departements.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={filterGeofencing}
              onChange={(e) => setFilterGeofencing(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm"
            >
              <option value="all">Géo.</option>
              <option value="alert">Alerte</option>
              <option value="safe">Sans alerte</option>
            </select>
            <Button onClick={handleExportCSV} size="sm" variant="outline">
              <Download className="size-4" />
              CSV
            </Button>
          </div>
        </div>

        <EmployeesPresence
          employees={employees}
          onViewEmployee={(id) => router.push(`/dashboard/employes/${id}`)}
        />
      </Card>
    </div>
  );
}