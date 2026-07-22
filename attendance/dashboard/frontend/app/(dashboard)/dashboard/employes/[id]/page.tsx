"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowLeft, CalendarDays, CalendarOff, Download, FileEdit, Power, Smartphone, Users } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import toast from "react-hot-toast"
import { Avatar } from "@/components/dashboard/avatar"
import { Badge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table"
import { useEmployeeDetail, useEmployees, useToggleAccount } from "@/lib/hooks/use-employees"
import { useSettings } from "@/lib/hooks/use-settings"
import { useCreateRequest } from "@/lib/hooks/use-requests"
import { useCreateModificationRequest } from "@/lib/hooks/use-modification-requests"
import { useAuth } from "@/hooks/useAuth"
import { createRequestSchema, createModificationRequestSchema } from "@/lib/schemas"
import { getNomComplet } from "@/lib/utils"
import type { PresenceJour } from "@/lib/types"
import { formatDate, formatDateTime, formatDuree, formatHeure } from "@/lib/utils"
import { anomalieTypeLabel, roleLabel, statutBadgeVariant, statutLabel } from "@/lib/labels"

const GeofenceMap = dynamic(
  () => import("@/components/dashboard/geofence-map").then((module) => module.GeofenceMap),
  { ssr: false },
)

const statusColors: Record<PresenceJour["statut"], string> = {
  present: "bg-chart-5",
  absent: "bg-destructive",
  retard: "bg-brand",
  ferie: "bg-signal",
  weekend: "bg-border",
}

export default function EmployeDetailPage() {
  const params = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const { data: detail, isLoading } = useEmployeeDetail(params.id)
  const { data: settings } = useSettings()
  const { data: allEmployees = [] } = useEmployees()
  const toggleAccount = useToggleAccount()
  const createRequest = useCreateRequest()
  const createModifRequest = useCreateModificationRequest()

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)
  const [demandeOpen, setDemandeOpen] = useState(false)
  const [demandeForm, setDemandeForm] = useState({ dateDebut: "", dateFin: "", motif: "" })
  const [demandeErrors, setDemandeErrors] = useState<Record<string, string>>({})
  const [requestSessionId, setRequestSessionId] = useState("")
  const [requestProposition, setRequestProposition] = useState("")
  const [requestRaison, setRequestRaison] = useState("")
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({})

  const selectedDay = useMemo(
    () => detail?.calendrier.find((day) => day.date === selectedDate) ?? null,
    [detail?.calendrier, selectedDate],
  )

  const lastPosition = useMemo(() => {
    if (!detail?.sessions?.length) return null
    const last = detail.sessions[0]
    if (last.latitude && last.longitude) return { lat: last.latitude, lng: last.longitude, date: last.date }
    return null
  }, [detail?.sessions])

  // Taux de présence : calculé côté client à partir du calendrier déjà chargé
  // (jours fériés/week-ends exclus du dénominateur, ils ne comptent pas contre l'employé).
  const presenceStats = useMemo(() => {
    if (!detail?.calendrier?.length) return null
    const joursTravailles = detail.calendrier.filter((d) => d.statut !== "ferie" && d.statut !== "weekend")
    if (joursTravailles.length === 0) return null
    const presents = joursTravailles.filter((d) => d.statut === "present" || d.statut === "retard").length
    const absents = joursTravailles.length - presents
    return {
      presents,
      absents,
      total: joursTravailles.length,
      pourcentagePresent: Math.round((presents / joursTravailles.length) * 100),
    }
  }, [detail?.calendrier])

  // Heures travaillées par jour : calculées à partir des sessions déjà chargées pour ce jour
  // (heure_depart - heure_arrivee, sessions encore en cours ignorées du calcul).
  const heuresParJour = useMemo(() => {
    const map: Record<string, number> = {}
    for (const jour of detail?.calendrier ?? []) {
      let minutes = 0
      for (const session of jour.sessions) {
        if (session.heure_depart) {
          minutes += Math.max(0, (new Date(session.heure_depart).getTime() - new Date(session.heure_arrivee).getTime()) / 60000)
        }
      }
      map[jour.date] = Math.round(minutes)
    }
    return map
  }, [detail?.calendrier])

  // Collègues du même département : statut du moment (donnée réellement disponible).
  // Un vrai "% de présence mensuel par collègue" nécessiterait un endpoint backend dédié,
  // qui n'existe pas encore — pas de chiffre inventé ici, uniquement le statut en direct.
  const collegues = useMemo(() => {
    if (!detail?.utilisateur) return []
    return allEmployees.filter((e) => e.id !== detail.utilisateur.id && e.departement === detail.utilisateur.departement && e.actif)
  }, [allEmployees, detail?.utilisateur])

  if (isLoading) {
    return <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground"><Spinner /><span>Chargement de la fiche employé...</span></div>
  }

  if (!detail) return <Card>Employé introuvable.</Card>

  const user = detail.utilisateur

  return (
    <div className="space-y-6">
      <Link href="/dashboard/employes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-2">
        <ArrowLeft className="size-4" /> Retour aux employés
      </Link>

      <Card className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar nom={getNomComplet(user)} src={user.photo_url} size="xl" />
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{getNomComplet(user)}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="brand">{user.role}</Badge>
              <Badge variant={statutBadgeVariant(user.statut_actuel)}>{statutLabel[user.statut_actuel] ?? user.statut_actuel}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { window.print(); toast.success("Préparation de l'export PDF via impression navigateur.") }}>
            <Download className="size-4" /> Exporter la fiche
          </Button>
          <Button variant="outline" onClick={() => setRequestOpen(true)}>
            <FileEdit className="size-4" /> Demander une modification
          </Button>
          <Button variant="outline" onClick={() => setDemandeOpen(true)}>
            <CalendarOff className="size-4" /> Faire une demande
          </Button>
          <Button variant="destructive" onClick={async () => {
            try {
              await toggleAccount.mutateAsync(user.id)
              toast.success(user.actif ? "Compte désactivé" : "Compte réactivé")
            } catch { toast.error("Erreur lors de la modification du compte") }
          }}>
            <Power className="size-4" /> {user.actif ? "Désactiver le compte" : "Réactiver le compte"}
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
            <p><span className="font-medium text-foreground">Marque / Modèle:</span> <span className="text-muted-foreground">{[user.appareil?.marque, user.appareil?.modele].filter(Boolean).join(" ") || "Aucun"}</span></p>
            <p><span className="font-medium text-foreground">Identifiant:</span> <span className="text-muted-foreground">{user.appareil?.identifiant_appareil}</span></p>
            <p><span className="font-medium text-foreground">Téléphone:</span> <span className="text-muted-foreground">{user.telephone || "Non renseigné"}</span></p>
            <p><span className="font-medium text-foreground">État:</span> <Badge variant={user.appareil?.actif ? "success" : "danger"}>{user.appareil?.actif ? "Actif" : "Inactif"}</Badge></p>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Géofencing</h3>
            <p className="text-sm text-muted-foreground">Dernière position connue et rayon de sécurité du bureau.</p>
          </div>
          <div className="mb-4 grid gap-2 text-sm text-muted-foreground">
            <p>Dernier relevé: {user.appareil?.derniere_geoloc?.date ? formatDateTime(user.appareil.derniere_geoloc.date) : "Indisponible"}</p>
            <p>Coordonnées bureau: {settings ? `${settings.coordonnees_bureau.lat}, ${settings.coordonnees_bureau.lng}` : "Chargement..."}</p>
          </div>
          {settings ? (
            <GeofenceMap center={settings.coordonnees_bureau} radius={settings.rayon_geofencing_metres} lastPosition={lastPosition} />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-muted/30 text-sm text-muted-foreground">Chargement de la carte...</div>
          )}
        </Card>
      </div>

      {presenceStats && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Taux de présence</h3>
            <p className="text-sm text-muted-foreground">Calculé sur les jours ouvrés du calendrier ci-dessous (fériés/week-ends exclus).</p>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
            <div className="relative h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Présent", value: presenceStats.presents },
                      { name: "Absent", value: presenceStats.absents },
                    ]}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={70}
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                  >
                    <Cell fill="var(--success-foreground)" />
                    <Cell fill="var(--danger-foreground)" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-data text-2xl font-semibold text-foreground">{presenceStats.pourcentagePresent}%</span>
                <span className="text-[11px] text-muted-foreground">présent</span>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-success-foreground" />
                <span className="text-muted-foreground">Présent — <span className="font-data text-foreground">{presenceStats.presents}</span> j.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-danger-foreground" />
                <span className="text-muted-foreground">Absent — <span className="font-data text-foreground">{presenceStats.absents}</span> j.</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="size-4 text-brand" />
          <h3 className="text-lg font-semibold text-foreground">Calendrier des présences</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {detail.calendrier.map((day) => (
            <button key={day.date} onClick={() => setSelectedDate(day.date)}
              className={`rounded-2xl border p-3 text-left transition ${selectedDate === day.date ? "border-brand bg-accent" : "border-border bg-card hover:bg-muted"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{new Date(day.date).getDate()}</span>
                <span className={`size-3 rounded-full ${statusColors[day.statut]}`} />
              </div>
              <p className="mt-2 text-xs capitalize text-muted-foreground">{day.statut}</p>
              <p className="mt-1 text-xs text-muted-foreground">{day.sessions.length} session(s)</p>
              {heuresParJour[day.date] > 0 && (
                <p className="font-data mt-0.5 text-xs font-medium text-foreground">{formatDuree(heuresParJour[day.date])}</p>
              )}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
          <h4 className="font-medium text-foreground">Détail du {selectedDay ? formatDate(selectedDay.date) : "jour sélectionné"}</h4>
          {selectedDay && selectedDay.sessions.length > 0 ? (
            <div className="mt-3 space-y-3">
              {selectedDay.sessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-border bg-card p-3">
                  <p className="text-sm font-medium text-foreground">{formatHeure(session.heure_arrivee)} → {session.heure_depart ? formatHeure(session.heure_depart) : "en cours"}</p>
                  <p className="text-xs text-muted-foreground">{session.methode_validation} · {session.lieu} · retard {session.retard_minutes} min</p>
                </div>
              ))}
            </div>
          ) : <p className="mt-2 text-sm text-muted-foreground">Aucune session détaillée pour ce jour.</p>}
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
              {[...detail.sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).map((session) => (
                <tr key={session.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(session.date)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatHeure(session.heure_arrivee)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.heure_depart ? formatHeure(session.heure_depart) : "en cours"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.retard_minutes} min</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.methode_validation}</td>
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
                <Badge variant={anomalie.traitee ? "success" : "danger"}>{anomalie.traitee ? "Traitée" : "Non traitée"}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{anomalie.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {collegues.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-4 text-brand" />
            <h3 className="text-lg font-semibold text-foreground">Collègues — {user.departement}</h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Statut en direct des autres membres du département. (Un taux de présence mensuel par collègue nécessiterait un endpoint backend dédié, pas encore disponible — seul le statut du moment est affiché ici.)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collegues.map((collegue) => (
              <Link
                key={collegue.id}
                href={`/dashboard/employes/${collegue.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:bg-muted"
              >
                <Avatar nom={getNomComplet(collegue)} src={collegue.photo_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{getNomComplet(collegue)}</p>
                  <p className="truncate text-xs text-muted-foreground">{roleLabel[collegue.role]}</p>
                </div>
                <Badge variant={statutBadgeVariant(collegue.statut_actuel)}>{statutLabel[collegue.statut_actuel] ?? collegue.statut_actuel}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Demande d'absence */}
      <Modal open={demandeOpen} onClose={() => { setDemandeOpen(false); setDemandeErrors({}) }} title="Faire une demande" description="Soumet une demande pour validation.">
        <div className="space-y-4">
          {(["dateDebut", "dateFin"] as const).map((field) => (
            <div key={field}>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{field === "dateDebut" ? "Date de début" : "Date de fin"}</label>
              <input type="date" value={demandeForm[field]} onChange={(e) => { setDemandeForm((f) => ({ ...f, [field]: e.target.value })); setDemandeErrors((prev) => ({ ...prev, [field]: "" })) }}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm" />
              {demandeErrors[field] && <p className="mt-1 text-xs text-destructive">{demandeErrors[field]}</p>}
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Motif</label>
            <textarea value={demandeForm.motif} onChange={(e) => { setDemandeForm((f) => ({ ...f, motif: e.target.value })); setDemandeErrors((prev) => ({ ...prev, motif: "" })) }}
              className="min-h-20 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-brand" placeholder="Raison de la demande..." />
            {demandeErrors.motif && <p className="mt-1 text-xs text-destructive">{demandeErrors.motif}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDemandeOpen(false); setDemandeErrors({}) }}>Annuler</Button>
            <Button disabled={createRequest.isPending} onClick={async () => {
              const parsed = createRequestSchema.safeParse({ ...demandeForm, type: "absence" })
              if (!parsed.success) {
                const errs: Record<string, string> = {}
                for (const issue of parsed.error.issues) errs[issue.path[0] as string] = issue.message
                setDemandeErrors(errs)
                return
              }
              try {
                await createRequest.mutateAsync({ type: "absence", ...demandeForm })
                toast.success("Demande soumise.")
                setDemandeOpen(false)
                setDemandeForm({ dateDebut: "", dateFin: "", motif: "" })
                setDemandeErrors({})
              } catch { toast.error("Échec de l'envoi.") }
            }}>Soumettre</Button>
          </div>
        </div>
      </Modal>

      {/* Demande de modification */}
      <Modal open={requestOpen} onClose={() => { setRequestOpen(false); setRequestErrors({}) }} title="Demander une modification" description="La demande sera soumise à validation d'un administrateur.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Session concernée</label>
            <select value={requestSessionId} onChange={(e) => { setRequestSessionId(e.target.value); setRequestErrors((prev) => ({ ...prev, sessionPresenceId: "" })) }}
              className="w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-brand">
              <option value="">Sélectionner une session...</option>
              {[...detail.sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).map((session) => (
                <option key={session.id} value={session.id}>
                  {formatDate(session.date)} · {formatHeure(session.heure_arrivee)}{session.heure_depart ? ` → ${formatHeure(session.heure_depart)}` : " (en cours)"}
                </option>
              ))}
            </select>
            {requestErrors.sessionPresenceId && <p className="mt-1 text-xs text-destructive">{requestErrors.sessionPresenceId}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Modification proposée</label>
            <textarea value={requestProposition} onChange={(e) => { setRequestProposition(e.target.value); setRequestErrors((prev) => ({ ...prev, modificationProposee: "" })) }}
              className="min-h-20 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-brand" placeholder="Ex: Arrivée à 08:00 au lieu de 09:15" />
            {requestErrors.modificationProposee && <p className="mt-1 text-xs text-destructive">{requestErrors.modificationProposee}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Raison</label>
            <textarea value={requestRaison} onChange={(e) => { setRequestRaison(e.target.value); setRequestErrors((prev) => ({ ...prev, raison: "" })) }}
              className="min-h-20 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-brand" placeholder="Justification de la correction..." />
            {requestErrors.raison && <p className="mt-1 text-xs text-destructive">{requestErrors.raison}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRequestOpen(false); setRequestErrors({}) }}>Annuler</Button>
            <Button disabled={createModifRequest.isPending} onClick={async () => {
              if (!currentUser) return
              const parsed = createModificationRequestSchema.safeParse({
                sessionPresenceId: requestSessionId,
                modificationProposee: requestProposition.trim(),
                raison: requestRaison.trim(),
              })
              if (!parsed.success) {
                const errs: Record<string, string> = {}
                for (const issue of parsed.error.issues) errs[issue.path[0] as string] = issue.message
                setRequestErrors(errs)
                return
              }
              try {
                await createModifRequest.mutateAsync({
                  gestionnaireId: currentUser.id,
                  sessionPresenceId: requestSessionId,
                  modificationProposee: requestProposition.trim(),
                  raison: requestRaison.trim(),
                })
                toast.success("Demande de modification soumise.")
                setRequestOpen(false)
                setRequestSessionId("")
                setRequestProposition("")
                setRequestRaison("")
                setRequestErrors({})
              } catch { toast.error("Échec de l'envoi de la demande.") }
            }}>Soumettre</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}