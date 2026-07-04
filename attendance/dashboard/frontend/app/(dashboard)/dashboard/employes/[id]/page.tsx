// app/(dashboard)/dashboard/employes/[id]/page.tsx
// Fiche complète d'un employé avec appareil, carte géofence, calendrier et sessions.

"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, FileEdit, Power, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/dashboard/avatar";
import { Badge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table";
import { api } from "@/lib/api";
import { getNomComplet } from "@/lib/data";
import type { EmployeDetail, ParametresSysteme, PresenceJour } from "@/lib/types";
import { formatDate, formatDateTime, formatHeure } from "@/lib/utils";
import { anomalieTypeLabel, statutBadgeVariant, statutLabel } from "@/lib/labels";

const GeofenceMap = dynamic(
  () => import("@/components/dashboard/geofence-map").then((module) => module.GeofenceMap),
  { ssr: false },
);

const statusColors: Record<PresenceJour["statut"], string> = {
  present: "bg-chart-5",
  absent: "bg-destructive",
  retard: "bg-brand",
  ferie: "bg-signal",
  weekend: "bg-border",
};

export default function EmployeDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<EmployeDetail | null>(null);
  const [settings, setSettings] = useState<ParametresSysteme | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    api.getEmployeeDetail(params.id).then((result) => {
      setDetail(result ?? null);
      setSelectedDate(result?.calendrier.find((day) => day.sessions.length > 0)?.date ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
    api.getSettings().then(setSettings).catch(() => setSettings(null));
  }, [params.id]);

  const selectedDay = useMemo(
    () => detail?.calendrier.find((day) => day.date === selectedDate) ?? null,
    [detail?.calendrier, selectedDate],
  );

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement de la fiche employé...</span>
      </div>
    );
  }

  if (!detail) {
    return <Card>Employé introuvable.</Card>;
  }

  const user = detail.utilisateur;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar nom={getNomComplet(user)} src={user.photo_url} size="xl" />
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{getNomComplet(user)}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="brand">{user.role}</Badge>
              <Badge variant={statutBadgeVariant(user.statut_actuel)}>
                {statutLabel[user.statut_actuel] ?? user.statut_actuel}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              window.print();
              toast.success("Préparation de l'export PDF via impression navigateur.");
            }}
          >
            <Download className="size-4" />
            Exporter la fiche
          </Button>
          <Button variant="outline" onClick={() => setRequestOpen(true)}>
            <FileEdit className="size-4" />
            Demander une modification
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await api.toggleAccount(user.id);
              toast.success("Compte désactivé pour la démonstration.");
            }}
          >
            <Power className="size-4" />
            Désactiver le compte
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Smartphone className="size-4 text-brand" />
            <h3 className="text-lg font-semibold text-foreground">Appareil</h3>
          </div>
          <div className="grid gap-3 text-sm">
            <p>
              <span className="font-medium text-foreground">Modèle:</span>{" "}
              <span className="text-muted-foreground">{user.appareil?.modele}</span>
            </p>
            <p>
              <span className="font-medium text-foreground">Identifiant:</span>{" "}
              <span className="text-muted-foreground">
                {user.appareil?.identifiant_appareil}
              </span>
            </p>
            <p>
              <span className="font-medium text-foreground">État:</span>{" "}
              <Badge variant={user.appareil?.actif ? "success" : "danger"}>
                {user.appareil?.actif ? "Actif" : "Inactif"}
              </Badge>
            </p>
            <Button
              className="mt-2 w-fit"
              variant="outline"
              onClick={async () => {
                await api.deactivateDevice(user.id);
                toast.success("État de l'appareil mis à jour pour la démo.");
              }}
            >
              {user.appareil?.actif ? "Désactiver" : "Réactiver"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Géofencing</h3>
            <p className="text-sm text-muted-foreground">
              Dernière position connue et rayon de sécurité du bureau.
            </p>
          </div>

          <div className="mb-4 grid gap-2 text-sm text-muted-foreground">
            <p>
              Dernier relevé:{" "}
              {user.appareil?.derniere_geoloc?.date
                ? formatDateTime(user.appareil.derniere_geoloc.date)
                : "Indisponible"}
            </p>
            <p>
              Coordonnées bureau:{" "}
              {settings
                ? `${settings.coordonnees_bureau.lat}, ${settings.coordonnees_bureau.lng}`
                : "Chargement..."}
            </p>
          </div>

          {settings ? (
            <GeofenceMap
              center={settings.coordonnees_bureau}
              radius={settings.rayon_geofencing_metres}
              lastPosition={user.appareil?.derniere_geoloc}
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-muted/30 text-sm text-muted-foreground">
              Chargement de la carte...
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="size-4 text-brand" />
          <h3 className="text-lg font-semibold text-foreground">Calendrier des présences</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {detail.calendrier.map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={`rounded-2xl border p-3 text-left transition ${
                selectedDate === day.date
                  ? "border-brand bg-accent"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {new Date(day.date).getDate()}
                </span>
                <span className={`size-3 rounded-full ${statusColors[day.statut]}`} />
              </div>
              <p className="mt-2 text-xs capitalize text-muted-foreground">{day.statut}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {day.sessions.length} session(s)
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
          <h4 className="font-medium text-foreground">
            Détail du {selectedDay ? formatDate(selectedDay.date) : "jour sélectionné"}
          </h4>
          {selectedDay && selectedDay.sessions.length > 0 ? (
            <div className="mt-3 space-y-3">
              {selectedDay.sessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-border bg-card p-3">
                  <p className="text-sm font-medium text-foreground">
                    {formatHeure(session.heure_arrivee)} →{" "}
                    {session.heure_depart ? formatHeure(session.heure_depart) : "en cours"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.methode_validation} · {session.lieu} · retard {session.retard_minutes} min
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Aucune session détaillée pour ce jour.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Historique des sessions</h3>
        <TableWrapper className="border-0">
          <Table>
            <thead className="bg-muted/50">
              <tr>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Arrivée</TableHeadCell>
                <TableHeadCell>Départ</TableHeadCell>
                <TableHeadCell>Retard</TableHeadCell>
                <TableHeadCell>Méthode</TableHeadCell>
                <TableHeadCell>Lieu</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {[...detail.sessions]
                .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
                .map((session) => (
                  <tr key={session.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(session.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatHeure(session.heure_arrivee)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {session.heure_depart ? formatHeure(session.heure_depart) : "en cours"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {session.retard_minutes} min
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {session.methode_validation}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{session.lieu}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </TableWrapper>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Anomalies associées</h3>
        <div className="space-y-3">
          {detail.anomalies.map((anomalie) => (
            <div key={anomalie.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{anomalieTypeLabel[anomalie.type] ?? anomalie.type}</p>
                <Badge variant={anomalie.traitee ? "success" : "danger"}>
                  {anomalie.traitee ? "Traitée" : "Non traitée"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{anomalie.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Demander une modification"
        description="Cette action simule une demande soumise à validation administrateur."
      >
        <div className="space-y-4">
          <textarea
            className="min-h-32 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-brand"
            placeholder="Décrivez la correction demandée..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRequestOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setRequestOpen(false);
                toast.success("Demande de modification enregistrée pour la démo.");
              }}
            >
              Soumettre
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}