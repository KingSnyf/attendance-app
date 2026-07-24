"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, ChevronDown, Coffee, Download, MapPinned, Plus, Search, UserX, Users } from "lucide-react"
import toast from "react-hot-toast"
import { Avatar } from "@/components/dashboard/avatar"
import { PresenceChart } from "@/components/dashboard/presence-chart"
import { Spinner } from "@/components/ui/spinner"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"
import { useRequests } from "@/lib/hooks/use-requests"
import { useSettings } from "@/lib/hooks/use-settings"
import { distanceMetres, exporterVersCSV, formatDuree, formatHeure, getNomComplet, telechargerCSV } from "@/lib/utils"

const GeofenceMap = dynamic(
  () => import("@/components/dashboard/geofence-map").then((m) => m.GeofenceMap),
  { ssr: false },
)

type Demande = {
  id: string
  motif: string
  statut: string
  dateDemande: string
  user: { firstName: string; lastName: string; photoUrl: string | null }
}

export default function DashboardPage() {
  const router = useRouter()
  const { data, isLoading, error } = useDashboardData()
  const { data: requests } = useRequests()
  const { data: settings } = useSettings()
  const [period, setPeriod] = useState<"semaine" | "mois">("semaine")
  const [department, setDepartment] = useState("all")
  const [search, setSearch] = useState("")
  const [employeeView, setEmployeeView] = useState<"tous" | "connectes" | "heure" | "retard">("tous")
  const sectionRef = useRef<HTMLDivElement>(null)
  const [sectionHeight, setSectionHeight] = useState<number>(0)

  const isLate = (iso?: string | null) => {
    if (!iso || !settings?.heure_debut_journee) return false
    const arrival = new Date(iso)
    const [hours, minutes] = settings.heure_debut_journee.split(":").map(Number)
    const limit = new Date(arrival)
    limit.setHours(hours, minutes + (settings.tolerance_retard_minutes ?? 0), 0, 0)
    return arrival > limit
  }

  const departments = useMemo(() => {
    const grouped = new Map<string, { total: number; onTime: number; late: number; leave: number }>()
    for (const employee of data?.employees ?? []) {
      const name = employee.departement || "Non renseigné"
      const item = grouped.get(name) ?? { total: 0, onTime: 0, late: 0, leave: 0 }
      item.total += 1
      if (employee.statut_actuel === "absent" || employee.statut_actuel === "conge") item.leave += 1
      else if (isLate(employee.premiere_arrivee)) item.late += 1
      else item.onTime += 1
      grouped.set(name, item)
    }
    return [...grouped.entries()].map(([name, values]) => ({ name, ...values })).sort((a, b) => b.total - a.total)
  }, [data?.employees, settings])

  const departmentEmployees = useMemo(() => {
    return [...(data?.employees ?? [])]
      .filter((employee) => department === "all" || employee.departement === department)
      .filter((employee) => !search || getNomComplet(employee).toLowerCase().includes(search.toLowerCase()))
  }, [data?.employees, department, search])

  const quickEmployees = useMemo(() => {
    return departmentEmployees
      .filter((employee) => {
        if (employeeView === "connectes") return Boolean(employee.premiere_arrivee)
        if (employeeView === "heure") return Boolean(employee.premiere_arrivee) && !isLate(employee.premiere_arrivee)
        if (employeeView === "retard") return Boolean(employee.premiere_arrivee) && isLate(employee.premiere_arrivee)
        return true
      })
      .sort((a, b) => {
        const timeA = a.premiere_arrivee ? new Date(a.premiere_arrivee).getTime() : 0
        const timeB = b.premiere_arrivee ? new Date(b.premiere_arrivee).getTime() : 0
        return timeB - timeA
      })
      .slice(0, 8)
  }, [departmentEmployees, employeeView, settings])

  const employeeCounts = useMemo(() => ({
    tous: departmentEmployees.length,
    connectes: departmentEmployees.filter((employee) => employee.premiere_arrivee).length,
    heure: departmentEmployees.filter((employee) => employee.premiere_arrivee && !isLate(employee.premiere_arrivee)).length,
    retard: departmentEmployees.filter((employee) => employee.premiere_arrivee && isLate(employee.premiere_arrivee)).length,
  }), [departmentEmployees, settings])

  const totalEmployees = data?.employees.length ?? 0
  const attendanceRate = totalEmployees > 0
    ? Math.round(((data?.stats.presents ?? 0) / totalEmployees) * 100)
    : 0

  const backlog = useMemo(
    () => ((requests as Demande[] | undefined) ?? []).filter((request) => request.statut === "en_attente").slice(0, 5),
    [requests],
  )

  const onSiteMarkers = useMemo(() => {
    if (!settings?.coordonnees_bureau || !settings?.rayon_geofencing_metres) return []
    return (data?.employees ?? [])
      .filter((employee) => employee.derniere_position)
      .filter((employee) => distanceMetres(settings.coordonnees_bureau, employee.derniere_position!) <= settings.rayon_geofencing_metres)
      .map((employee) => ({
        lat: employee.derniere_position!.lat,
        lng: employee.derniere_position!.lng,
        label: getNomComplet(employee),
        sub: employee.departement,
      }))
  }, [data?.employees, settings])

  useEffect(() => {
    const measure = () => {
      if (sectionRef.current) setSectionHeight(sectionRef.current.clientHeight)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [data, period, department])

  if (isLoading) return <div className="flex min-h-[55vh] items-center justify-center gap-3 text-[#7d8496]"><Spinner /> Chargement du tableau de bord...</div>
  if (error || !data) return <div className="p-6 text-sm text-red-600">Impossible de charger le tableau de bord.</div>

  const exportCsv = () => {
    const csv = exporterVersCSV(data.employees.map((employee) => ({
      nom: getNomComplet(employee),
      departement: employee.departement,
      statut: employee.statut_actuel,
      arrivee: employee.premiere_arrivee ? formatHeure(employee.premiere_arrivee) : "-",
      duree: formatDuree(employee.temps_cumule_minutes),
    })))
    telechargerCSV("presence-employes.csv", csv)
    toast.success("Export CSV généré.")
  }

  return (
    <div className="mx-auto max-w-375">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-[#8a91a3]">Tableau de bord</p>
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-md border border-[#dfe3e9] bg-white px-3 py-2 text-xs font-medium text-[#454d61]">
          <Download className="size-3.5" /> Exporter
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Présents", value: data.stats.presents, detail: `${attendanceRate}% de l'effectif`, Icon: CheckCircle2, tone: "bg-[#e9f7f2] text-[#238b70]" },
          { label: "Absents", value: data.stats.absents, detail: "Non pointés aujourd'hui", Icon: UserX, tone: "bg-[#fbecee] text-[#bd4e5a]" },
          { label: "En pause", value: data.stats.enPause, detail: "Pause en cours", Icon: Coffee, tone: "bg-[#edf3ff] text-[#5363dc]" },
          { label: "Anomalies", value: data.stats.anomaliesNonTraitees, detail: "À vérifier", Icon: AlertTriangle, tone: "bg-[#fff3e5] text-[#b87527]" },
        ].map(({ label, value, detail, Icon, tone }) => (
          <div key={label} className="flex items-center gap-4 rounded-lg border border-[#e1e5eb] bg-white p-4 shadow-[0_2px_8px_rgba(31,42,68,.03)]">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="size-4.5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] text-[#8a91a3]">{label}</p>
              <div className="flex items-end gap-2"><p className="font-data text-xl font-semibold text-[#17203a]">{value}</p><p className="truncate pb-0.5 text-[9px] text-[#8a91a3]">{detail}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-start">
        <section ref={sectionRef} className="flex-[1.65] min-w-0 space-y-4">
          <div className="overflow-hidden rounded-lg border border-[#e1e5eb] bg-white shadow-[0_2px_10px_rgba(31,42,68,.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f3] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-[#111a35]">Statut des présences</h2>
                <p className="text-[10px] text-[#8a91a3]">{period === "semaine" ? "Semaine en cours" : "Vue mensuelle"}</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={department} onChange={(event) => setDepartment(event.target.value)}
                  className="h-9 rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px] text-[#454d61]">
                  <option value="all">Tous les départements</option>
                  {departments.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
                <select value={period} onChange={(event) => setPeriod(event.target.value as "semaine" | "mois")} className="h-9 rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px]">
                  <option value="semaine">Semaine</option>
                  <option value="mois">Mois</option>
                </select>
              </div>
            </div>
            <div className="px-3 pb-2 pt-3">
              <PresenceChart data={period === "semaine" ? data.weeklyPresence : data.monthlyPresence} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-lg border border-[#e1e5eb] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#111a35]">Demandes en attente ({backlog.length})</h2>
                <Link href="/dashboard/demandes" className="text-[10px] font-medium text-[#4556d4] underline">Voir les détails</Link>
              </div>
              <div className="space-y-3">
                {backlog.map((request) => {
                  const age = Math.max(0, Math.floor((Date.now() - new Date(request.dateDemande).getTime()) / 86400000))
                  return (
                    <div key={request.id} className="grid grid-cols-[1fr_55px_70px] items-center gap-3 text-[11px]">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar nom={`${request.user.firstName} ${request.user.lastName}`} src={request.user.photoUrl} size="sm" />
                        <div className="min-w-0"><p className="truncate font-medium text-[#222b45]">{request.user.firstName} {request.user.lastName}</p><p className="truncate text-[9px] text-[#8a91a3]">{request.motif}</p></div>
                      </div>
                      <span className="text-[#5e6679]">{age || 1} j</span>
                      <span className="text-right text-[#7a8294]">{age * 8 || 2} h</span>
                    </div>
                  )
                })}
                {!backlog.length && <p className="py-6 text-center text-xs text-[#8a91a3]">Aucune demande en attente.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-[#e1e5eb] bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#17203a]">Aperçu opérationnel</h2>
                  <p className="text-[9px] text-[#8a91a3]">Situation actuelle de l'équipe</p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5363dc]"><Users className="size-4" /></span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#eef0f3] pb-3 text-[10px]"><span className="text-[#7d8496]">Effectif total</span><b className="font-data text-[#17203a]">{totalEmployees}</b></div>
                <div className="flex items-center justify-between border-b border-[#eef0f3] pb-3 text-[10px]"><span className="text-[#7d8496]">Taux de présence</span><b className="font-data text-[#278f73]">{attendanceRate}%</b></div>
                <div className="flex items-center justify-between text-[10px]"><span className="text-[#7d8496]">Alertes géolocalisation</span><b className="font-data text-[#b87527]">{data.geofencingAlerts.length}</b></div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link href="/dashboard/employes/nouveau" className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#5363dc] text-[10px] font-semibold text-white"><Plus className="size-3.5" /> Ajouter</Link>
                <Link href="/dashboard/anomalies" className="flex h-9 items-center justify-center rounded-md border border-[#dfe3e9] text-[10px] font-medium text-[#596174]">Voir les alertes</Link>
              </div>
            </div>
          </div>
        </section>

        <aside className="flex-[1.35] min-w-0 flex flex-col rounded-lg border border-[#e1e5eb] bg-white overflow-hidden" style={sectionHeight ? { maxHeight: sectionHeight } : undefined}>
          <div className="shrink-0 border-b border-[#eef0f3] p-4">
            <div className="flex items-center justify-between"><h2 className="text-xs font-semibold text-[#111a35]">Sélection du département</h2><ChevronDown className="size-3.5" /></div>
            <div className="mt-4 flex gap-4 overflow-x-auto text-[10px]">
              {([
                ["tous", "Tous", employeeCounts.tous],
                ["connectes", "Connectés", employeeCounts.connectes],
                ["heure", "À l'heure", employeeCounts.heure],
                ["retard", "Retard", employeeCounts.retard],
              ] as const).map(([value, label, count]) => (
                <button
                  key={value}
                  onClick={() => setEmployeeView(value)}
                  className={`shrink-0 pb-2 ${employeeView === value ? "border-b-2 border-[#5363dc] font-semibold text-[#17203a]" : "text-[#8a91a3]"}`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            <div className="relative mt-3"><Search className="absolute left-3 top-2.5 size-3.5 text-[#9298a8]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un employé" className="h-9 w-full rounded-md border border-[#e2e5eb] pl-9 pr-3 text-[10px] outline-none focus:border-[#5363dc]" /></div>
          </div>
          <div style={{ flex: '1 1 0%', minHeight: '0', overflowY: 'auto' }}>
            {quickEmployees.map((employee) => (
              <button key={employee.id} onClick={() => router.push(`/dashboard/employes/${employee.id}`)} className="flex w-full items-start gap-3 border-b border-[#eef0f3] px-4 py-3 text-left last:border-0 hover:bg-[#fafbfc]">
                <Avatar nom={getNomComplet(employee)} src={employee.photo_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-semibold text-[#17203a]">{getNomComplet(employee)}</p><span className={`size-1.5 rounded-full ${isLate(employee.premiere_arrivee) ? "bg-[#55c4df]" : "bg-[#5363dc]"}`} /></div>
                  <p className="truncate text-[9px] text-[#8a91a3]">{employee.departement} | {employee.role}</p>
                  <p className="font-data mt-1.5 text-[9px] text-[#61697c]">Arrivée : {employee.premiere_arrivee ? formatHeure(employee.premiere_arrivee) : "Pas encore connecté"}</p>
                  <p className="font-data text-[9px] text-[#8a91a3]">Départ : -</p>
                </div>
              </button>
            ))}
            {!quickEmployees.length && <p className="p-8 text-center text-xs text-[#8a91a3]">Aucun employé dans cette catégorie.</p>}
          </div>
        </aside>
      </div>

      {settings?.coordonnees_bureau && (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#e1e5eb] bg-white shadow-[0_2px_10px_rgba(31,42,68,.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f3] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5363dc]"><MapPinned className="size-4" /></span>
              <div>
                <h2 className="text-sm font-semibold text-[#111a35]">Présence sur site</h2>
                <p className="text-[10px] text-[#8a91a3]">Zone autorisée et employés actuellement à l'intérieur ({onSiteMarkers.length})</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <GeofenceMap
              center={settings.coordonnees_bureau}
              radius={settings.rayon_geofencing_metres}
              markers={onSiteMarkers}
              height="h-96"
            />
          </div>
        </div>
      )}
    </div>
  )
}