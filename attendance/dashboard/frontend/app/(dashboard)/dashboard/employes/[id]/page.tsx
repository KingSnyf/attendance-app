"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileEdit, Mail, MapPin, Phone, Power, Smartphone } from "lucide-react"
import toast from "react-hot-toast"
import { Avatar } from "@/components/dashboard/avatar"
import { Spinner } from "@/components/ui/spinner"
import { useEmployeeDetail, useToggleAccount } from "@/lib/hooks/use-employees"
import { formatDate, formatDuree, formatHeure, getNomComplet } from "@/lib/utils"
import { roleLabel, statutLabel } from "@/lib/labels"
import type { PresenceJour } from "@/lib/types"

const statusStyle: Record<PresenceJour["statut"], string> = {
  present: "bg-[#5363dc] text-white",
  retard: "bg-[#55c4df] text-white",
  absent: "bg-[#f3c7cc] text-[#9b3e49]",
  ferie: "bg-[#f0e7dc] text-[#846446]",
  weekend: "bg-[#f0f2f5] text-[#adb2bd]",
}

export default function EmployeDetailPage() {
  const params = useParams<{ id: string }>()
  const { data: detail, isLoading } = useEmployeeDetail(params.id)
  const toggleAccount = useToggleAccount()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const calendarByDate = useMemo(() => new Map((detail?.calendrier ?? []).map((day) => [day.date.slice(0, 10), day])), [detail?.calendrier])
  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const previousMonthDays = new Date(year, month, 0).getDate()
    return Array.from({ length: 42 }, (_, index) => {
      const rawDay = index - firstWeekday + 1
      let date = new Date(year, month, rawDay)
      let muted = false
      let label = rawDay
      if (rawDay <= 0) {
        label = previousMonthDays + rawDay
        muted = true
      } else if (rawDay > daysInMonth) {
        label = rawDay - daysInMonth
        muted = true
      }
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      return { key, label, muted, presence: calendarByDate.get(key) }
    })
  }, [calendarByDate, monthCursor])

  const selectedDay = selectedDate ? calendarByDate.get(selectedDate) : undefined
  const stats = useMemo(() => {
    const workable = (detail?.calendrier ?? []).filter((day) => day.statut !== "ferie" && day.statut !== "weekend")
    const present = workable.filter((day) => day.statut === "present" || day.statut === "retard").length
    const late = workable.filter((day) => day.statut === "retard").length
    const absent = workable.filter((day) => day.statut === "absent").length
    const rate = workable.length ? Math.round((present / workable.length) * 100) : 0
    return { present, late, absent, total: workable.length, rate }
  }, [detail?.calendrier])

  const workedMinutes = useMemo(() => (detail?.sessions ?? []).reduce((sum, session) => {
    if (!session.heure_depart) return sum
    return sum + Math.max(0, Math.round((new Date(session.heure_depart).getTime() - new Date(session.heure_arrivee).getTime()) / 60000))
  }, 0), [detail?.sessions])

  if (isLoading) return <div className="flex min-h-[55vh] items-center justify-center gap-3 text-[#7d8496]"><Spinner /> Chargement de la fiche...</div>
  if (!detail) return <div className="p-6 text-sm text-red-600">Employé introuvable.</div>
  const user = detail.utilisateur

  return (
    <div className="mx-auto max-w-362.5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/employes" className="mb-2 inline-flex items-center gap-2 text-[10px] text-[#8a91a3]"><ArrowLeft className="size-3" /> Retour aux employés</Link>
          <h1 className="text-lg font-semibold text-[#111a35]">Profil employé</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className="flex h-9 items-center gap-2 rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px] text-[#4c5468]"><Download className="size-3.5" /> Exporter</button>
          <button onClick={() => toast("Les demandes de modification restent disponibles depuis la page Modifications.")} className="flex h-9 items-center gap-2 rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px] text-[#4c5468]"><FileEdit className="size-3.5" /> Modifier</button>
          <button onClick={async () => {
            try {
              await toggleAccount.mutateAsync(user.id)
              toast.success(user.actif ? "Compte désactivé." : "Compte réactivé.")
            } catch { toast.error("Action impossible.") }
          }} className="flex h-9 items-center gap-2 rounded-md border border-[#efcfd2] bg-white px-3 text-[11px] text-[#b64954]"><Power className="size-3.5" /> {user.actif ? "Désactiver" : "Réactiver"}</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
        <section className="space-y-4">
          <div className="rounded-lg border border-[#e1e5eb] bg-white p-5">
            <div className="flex items-center gap-4 border-b border-[#eef0f3] pb-5">
              <Avatar nom={getNomComplet(user)} src={user.photo_url} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-[#17203a]">{getNomComplet(user)}</h2><span className={`rounded-full px-2 py-1 text-[9px] ${user.actif ? "bg-[#e6f6f1] text-[#278f73]" : "bg-[#fbe9eb] text-[#b64954]"}`}>{user.actif ? "Actif" : "Inactif"}</span></div>
                <p className="mt-1 text-[10px] text-[#8a91a3]">{roleLabel[user.role]} · {user.departement}</p>
              </div>
            </div>
            <div className="grid gap-4 pt-5 sm:grid-cols-2">
              <p className="flex items-center gap-3 text-[11px] text-[#596174]"><Mail className="size-4 text-[#788096]" /> {user.email}</p>
              <p className="flex items-center gap-3 text-[11px] text-[#596174]"><Phone className="size-4 text-[#788096]" /> {user.telephone || "Non renseigné"}</p>
              <p className="flex items-center gap-3 text-[11px] text-[#596174]"><Smartphone className="size-4 text-[#788096]" /> {user.appareil ? `${user.appareil.marque ?? ""} ${user.appareil.modele}` : "Aucun appareil"}</p>
              <p className="flex items-center gap-3 text-[11px] text-[#596174]"><MapPin className="size-4 text-[#788096]" /> {user.appareil?.derniere_geoloc ? "Position disponible" : "Position indisponible"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-[#e1e5eb] bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <div><h2 className="text-sm font-semibold text-[#17203a]">Informations de présence</h2><p className="text-[10px] text-[#8a91a3]">Synthèse sur la période chargée</p></div>
              <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-[10px] font-medium text-[#5363dc]">{statutLabel[user.statut_actuel] ?? user.statut_actuel}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Jours présents", stats.present], ["Retards", stats.late], ["Absences", stats.absent], ["Temps cumulé", formatDuree(workedMinutes)]].map(([label, value]) => (
                <div key={String(label)} className="border-l-2 border-[#e8ebf0] pl-3"><p className="text-[9px] text-[#8a91a3]">{label}</p><p className="font-data mt-1 text-lg font-semibold text-[#17203a]">{value}</p></div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#e1e5eb] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-[#17203a]">Dernières sessions</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-140 text-left text-[10px]">
                <thead className="text-[#8a91a3]"><tr><th className="pb-3">Date</th><th className="pb-3">Arrivée</th><th className="pb-3">Départ</th><th className="pb-3">Retard</th><th className="pb-3">Lieu</th></tr></thead>
                <tbody>
                  {detail.sessions.slice(0, 7).map((session) => <tr key={session.id} className="border-t border-[#eef0f3] text-[#596174]"><td className="py-3">{formatDate(session.date)}</td><td>{formatHeure(session.heure_arrivee)}</td><td>{session.heure_depart ? formatHeure(session.heure_depart) : "En cours"}</td><td>{session.retard_minutes} min</td><td>{session.lieu}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-[#e1e5eb] bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <button onClick={() => setMonthCursor((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="rounded-md p-2 hover:bg-[#f3f5f8]" aria-label="Mois précédent"><ChevronLeft className="size-4" /></button>
              <h2 className="text-sm font-semibold capitalize text-[#17203a]">{monthCursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h2>
              <button onClick={() => setMonthCursor((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="rounded-md p-2 hover:bg-[#f3f5f8]" aria-label="Mois suivant"><ChevronRight className="size-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-[#8a91a3]">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell) => (
                <button key={cell.key} onClick={() => !cell.muted && setSelectedDate(cell.key)} className={`aspect-square rounded-md text-[10px] transition ${cell.muted ? "text-[#c8ccd4]" : cell.presence ? statusStyle[cell.presence.statut] : "text-[#566074] hover:bg-[#f1f3f6]"} ${selectedDate === cell.key ? "ring-2 ring-[#17203a] ring-offset-1" : ""}`}>
                  {cell.label}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-4 border-t border-[#eef0f3] pt-4 text-[9px] text-[#7d8496]">
              {[["bg-[#5363dc]", "Présent"], ["bg-[#55c4df]", "Retard"], ["bg-[#f3c7cc]", "Absent"], ["bg-[#f0e7dc]", "Férié"]].map(([color, label]) => <span key={label} className="flex items-center gap-1.5"><span className={`size-2 rounded-sm ${color}`} />{label}</span>)}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[.8fr_1.2fr]">
            <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-[#e1e5eb] bg-white p-5">
              <div className="relative flex size-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(#5363dc ${stats.rate * 3.6}deg, #edf0f4 0)` }}>
                <div className="flex size-20 flex-col items-center justify-center rounded-full bg-white"><span className="font-data text-2xl font-semibold text-[#17203a]">{stats.rate}%</span><span className="text-[8px] text-[#8a91a3]">Présence</span></div>
              </div>
            </div>
            <div className="rounded-lg border border-[#e1e5eb] bg-white p-5">
              <h3 className="text-xs font-semibold text-[#17203a]">{selectedDay ? `Détail du ${formatDate(selectedDay.date)}` : "Sélectionnez un jour"}</h3>
              {selectedDay ? <div className="mt-4 space-y-3">{selectedDay.sessions.map((session) => <div key={session.id} className="border-l-2 border-[#5363dc] pl-3"><p className="font-data text-[11px] font-semibold text-[#17203a]">{formatHeure(session.heure_arrivee)} - {session.heure_depart ? formatHeure(session.heure_depart) : "En cours"}</p><p className="text-[9px] text-[#8a91a3]">{session.lieu} · {session.methode_validation}</p></div>)}{!selectedDay.sessions.length && <p className="text-[10px] text-[#8a91a3]">Aucune session enregistrée.</p>}</div> : <p className="mt-3 text-[10px] leading-5 text-[#8a91a3]">Cliquez sur une date colorée du calendrier pour consulter ses horaires.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
