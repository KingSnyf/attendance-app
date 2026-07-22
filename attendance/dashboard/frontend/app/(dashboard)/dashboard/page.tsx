// app/(dashboard)/dashboard/page.tsx
// Vue d'ensemble du système avec KPI, alertes GPS, graphique et tableau des employés.

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AlertTriangle, Building2, CheckCircle2, Clock, Coffee, Download, Inbox, MapPin, XCircle } from "lucide-react";

const EmployeeMap = dynamic(() => import("@/components/dashboard/employee-map"), { ssr: false });
import toast from "react-hot-toast";
import { Avatar } from "@/components/dashboard/avatar";
import { Badge } from "@/components/dashboard/status-badge";
import { EmployeesPresence } from "@/components/dashboard/employeesPresence";
import { AnomaliesWidget } from "@/components/dashboard/anomalies-widget";
import { PresenceChart } from "@/components/dashboard/presence-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDashboardData } from "@/lib/hooks/use-dashboard-data";
import { useSettings } from "@/lib/hooks/use-settings";
import { useRequests } from "@/lib/hooks/use-requests";
import { exporterVersCSV, formatDuree, formatHeure, getNomComplet, telechargerCSV } from "@/lib/utils";

type Demande = {
  id: string
  type: string
  motif: string
  statut: string
  dateDemande: string
  user: { id: string; firstName: string; lastName: string; photoUrl: string | null }
}

export default function VueEnsemblePage() {
  const router = useRouter();
  const { data, isLoading, error } = useDashboardData();
  const { data: settingsData } = useSettings();
  const { data: requestsData } = useRequests();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartement, setFilterDepartement] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterGeofencing, setFilterGeofencing] = useState("all");
  const [period, setPeriod] = useState<"semaine" | "mois">("semaine");
  const aujourdhui = useMemo(
    () => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    [],
  );

  // Un employé est en retard si sa première arrivée dépasse heure_debut_journee + tolérance.
  const estEnRetard = useMemo(() => {
    return (premiereArriveeIso: string) => {
      if (!settingsData?.heure_debut_journee) return false;
      const [h, m] = settingsData.heure_debut_journee.split(":").map(Number);
      const arrivee = new Date(premiereArriveeIso);
      const limite = new Date(arrivee);
      limite.setHours(h, (m || 0) + (settingsData.tolerance_retard_minutes ?? 0), 0, 0);
      return arrivee > limite;
    };
  }, [settingsData]);

  // Répartition par département — inspirée du panneau "All Departments" de la maquette,
  // calculée depuis les employés déjà chargés (pas de nouvel appel réseau).
  const departementsStats = useMemo(() => {
    const map = new Map<string, { total: number; presents: number; retards: number; absents: number }>();
    for (const e of data?.employees ?? []) {
      const dep = e.departement || "Non renseigné";
      if (!map.has(dep)) map.set(dep, { total: 0, presents: 0, retards: 0, absents: 0 });
      const entry = map.get(dep)!;
      entry.total++;
      if (e.statut_actuel === "absent") entry.absents++;
      else if (e.premiere_arrivee && estEnRetard(e.premiere_arrivee)) entry.retards++;
      else if (e.statut_actuel === "present" || e.statut_actuel === "en_attente") entry.presents++;
    }
    return Array.from(map.entries())
      .map(([nom, stats]) => ({ nom, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [data?.employees, estEnRetard]);

  // Derniers pointages — inspiré du panneau "Logged in / On Time / Late" de la maquette.
  const derniersPointages = useMemo(() => {
    return (data?.employees ?? [])
      .filter((e) => e.premiere_arrivee)
      .sort((a, b) => new Date(b.premiere_arrivee!).getTime() - new Date(a.premiere_arrivee!).getTime())
      .slice(0, 6)
      .map((e) => ({ ...e, enRetard: estEnRetard(e.premiere_arrivee!) }));
  }, [data?.employees, estEnRetard]);

  // Demandes en attente — inspiré du panneau "Backlog" de la maquette. L'API renvoie
  // toutes les demandes pour un admin (pas seulement en_attente), on filtre donc ici.
  const demandesEnAttente = useMemo(() => {
    return ((requestsData as Demande[]) ?? [])
      .filter((r) => r.statut === "en_attente")
      .slice(0, 5);
  }, [requestsData]);

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

  const totalEmployes = data?.employees.length ?? 0;

  const geofencingStats = useMemo(() => {
    const employees = data?.employees ?? []
    const alertUserIds = new Set(data?.geofencingAlerts.map((a) => a.user_id))
    let inside = 0, outside = 0
    for (const emp of employees) {
      if (emp.statut_actuel === "present" || emp.statut_actuel === "en_attente") {
        if (alertUserIds.has(emp.id)) outside++
        else inside++
      }
    }
    return { inside, outside }
  }, [data])

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
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-[28px] font-bold leading-tight text-foreground">
            Vue d'ensemble
          </h2>
          <p className="text-sm capitalize text-muted-foreground">
            Bienvenue, voici le point sur l'activité — {aujourdhui}.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => setPeriod("semaine")}
            className={
              period === "semaine"
                ? "rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
            }
          >
            Semaine
          </button>
          <button
            onClick={() => setPeriod("mois")}
            className={
              period === "mois"
                ? "rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
            }
          >
            Mois
          </button>
        </div>
      </div>

      {/* Grille de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Présents"
          value={data.stats.presents}
          variant="success"
          hint={totalEmployes > 0 ? `${Math.round((data.stats.presents / totalEmployes) * 100)}% de l'effectif` : undefined}
        />
        <StatCard
          icon={XCircle}
          label="Absents"
          value={data.stats.absents}
          variant="danger"
          hint={totalEmployes > 0 ? `${Math.round((data.stats.absents / totalEmployes) * 100)}% de l'effectif` : undefined}
        />
        <StatCard
          icon={Coffee}
          label="En pause"
          value={data.stats.enPause}
          variant="warning"
          progress={totalEmployes > 0 ? (data.stats.enPause / totalEmployes) * 100 : 0}
        />
        <StatCard
          icon={AlertTriangle}
          label="Anomalies"
          value={data.stats.anomaliesNonTraitees}
          variant="info"
          hint={data.stats.anomaliesNonTraitees > 0 ? "Vérifier les pointages →" : "Rien à signaler"}
        />
      </div>

      {/* Répartition par département */}
      {departementsStats.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="size-5 text-brand" />
            <h2 className="font-heading text-lg font-semibold text-foreground">Répartition par département</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {departementsStats.map((dep) => (
              <div key={dep.nom} className="rounded-xl border border-border bg-card p-4">
                <p className="truncate text-sm font-medium text-foreground">{dep.nom}</p>
                <p className="font-data mt-1 text-2xl font-bold text-foreground">{dep.total}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-data font-semibold text-success-foreground">{dep.presents}</p>
                    <p className="text-muted-foreground">Présents</p>
                  </div>
                  <div>
                    <p className="font-data font-semibold text-warning-foreground">{dep.retards}</p>
                    <p className="text-muted-foreground">Retards</p>
                  </div>
                  <div>
                    <p className="font-data font-semibold text-danger-foreground">{dep.absents}</p>
                    <p className="text-muted-foreground">Absents</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Carte de la zone autorisée */}
      {settingsData && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="size-5 text-brand" />
            <h2 className="font-heading text-lg font-semibold text-foreground">Zone de pointage</h2>
            <span className="ml-auto text-xs text-muted-foreground">{geofencingStats.inside + geofencingStats.outside} employé(s) actif(s)</span>
          </div>
          <EmployeeMap
            officeCenter={{ lat: settingsData.coordonnees_bureau.lat, lng: settingsData.coordonnees_bureau.lng }}
            officeRadius={settingsData.rayon_geofencing_metres}
            insideCount={geofencingStats.inside}
            outsideCount={geofencingStats.outside}
          />
        </Card>
      )}

      {/* Graphique + anomalies à traiter, côte à côte */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PresenceChart
            data={period === "semaine" ? data.weeklyPresence : data.monthlyPresence}
            title="Présence collective"
            subtitle={period === "semaine" ? "Semaine en cours" : "Tendance mensuelle"}
          />
        </div>
        <AnomaliesWidget />
      </div>

      {/* Demandes en attente (backlog) + derniers pointages, côte à côte */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="size-5 text-brand" />
              <h2 className="font-heading text-lg font-semibold text-foreground">Demandes en attente</h2>
            </div>
            <Link href="/dashboard/demandes" className="text-xs font-medium text-brand hover:underline">
              Voir tout →
            </Link>
          </div>
          {demandesEnAttente.length > 0 ? (
            <div className="space-y-2">
              {demandesEnAttente.map((demande) => {
                const jours = Math.max(0, Math.floor((Date.now() - new Date(demande.dateDemande).getTime()) / 86400000));
                return (
                  <div key={demande.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <Avatar nom={`${demande.user.firstName} ${demande.user.lastName}`} src={demande.user.photoUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{demande.user.firstName} {demande.user.lastName}</p>
                      <p className="truncate text-xs text-muted-foreground">{demande.motif}</p>
                    </div>
                    <Badge variant="warning">{jours <= 0 ? "Aujourd'hui" : `${jours} j`}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="size-5 text-brand" />
            <h2 className="font-heading text-lg font-semibold text-foreground">Derniers pointages</h2>
          </div>
          {derniersPointages.length > 0 ? (
            <div className="space-y-2">
              {derniersPointages.map((employee) => (
                <div key={employee.id} className="flex items-center gap-3">
                  <Avatar nom={getNomComplet(employee)} src={employee.photo_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{getNomComplet(employee)}</p>
                    <p className="truncate text-xs text-muted-foreground">{formatHeure(employee.premiere_arrivee!)}</p>
                  </div>
                  <Badge variant={employee.enRetard ? "danger" : "success"}>{employee.enRetard ? "Retard" : "À l'heure"}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun pointage aujourd'hui.</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Présence des employés</h2>
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