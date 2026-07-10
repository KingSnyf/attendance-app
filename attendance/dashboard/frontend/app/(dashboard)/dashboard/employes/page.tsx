"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Coffee, Plus, UserX, Users } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import toast from "react-hot-toast"
import { Avatar } from "@/components/dashboard/avatar"
import { Badge } from "@/components/dashboard/status-badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmployeeFilters } from "@/components/dashboard/employee-filters"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Spinner } from "@/components/ui/spinner"
import { useEmployees, useCreateEmployee, useToggleAccount, useResetPin } from "@/lib/hooks/use-employees"
import { useAuth } from "@/hooks/useAuth"
import { createEmployeeSchema } from "@/lib/schemas"
import { departementsDisponibles, getNomComplet } from "@/lib/data"
import { roleLabel, statutBadgeVariant, statutLabel } from "@/lib/labels"
import type { Utilisateur } from "@/lib/types"

export default function EmployesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const { data: employees = [], isLoading } = useEmployees()
  const createEmployee = useCreateEmployee()
  const toggleAccount = useToggleAccount()
  const resetPin = useResetPin()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterDepartement, setFilterDepartement] = useState("all")
  const [filterStatut, setFilterStatut] = useState("all")
  const [filterGeofencing, setFilterGeofencing] = useState("all")
  const [filterActif, setFilterActif] = useState("actifs")
  const [createOpen, setCreateOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "", role: "employe",
    departement: departementsDisponibles[0] ?? "Production",
  })

  const stats = useMemo(() => {
    const actifs = employees.filter((e) => e.actif)
    return {
      total: employees.length,
      presents: actifs.filter((e) => e.statut_actuel === "present").length,
      enPause: actifs.filter((e) => e.statut_actuel === "en_attente").length,
      absents: actifs.filter((e) => e.statut_actuel === "absent" || e.statut_actuel === "conge").length,
    }
  }, [employees])

  const filtered = useMemo(
    () =>
      employees.filter((employee) => {
        const search = searchQuery.toLowerCase().trim()
        return (
          (!search || getNomComplet(employee).toLowerCase().includes(search) || employee.email.toLowerCase().includes(search)) &&
          (filterDepartement === "all" || employee.departement === filterDepartement) &&
          (filterStatut === "all" || employee.statut_actuel === filterStatut) &&
          (filterActif === "actifs" ? employee.actif : filterActif === "desactives" ? !employee.actif : true)
        )
      }),
    [employees, filterDepartement, filterStatut, searchQuery, filterActif],
  )

  const handleCreate = async () => {
    const parsed = createEmployeeSchema.safeParse(form)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) errs[issue.path[0] as string] = issue.message
      setFormErrors(errs)
      return
    }
    try {
      await createEmployee.mutateAsync({ ...form, isAdmin, role: form.role })
      toast.success("Employé créé.")
      setCreateOpen(false)
      setFormErrors({})
      setForm({ nom: "", prenom: "", email: "", telephone: "", role: "employe", departement: departementsDisponibles[0] ?? "Production" })
    } catch { toast.error("Erreur lors de la création. Vérifiez les champs.") }
  }

  const columns: ColumnDef<Utilisateur>[] = [
    {
      header: "Employé",
      accessorKey: "nom",
      enableSorting: true,
      cell: ({ row }) => {
        const emp = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar nom={getNomComplet(emp)} src={emp.photo_url} size="sm" />
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">{getNomComplet(emp)}</p>
              <p className="text-[11px] text-muted-foreground">{emp.id}</p>
            </div>
          </div>
        )
      },
    },
    { header: "Email", accessorKey: "email", enableSorting: true },
    { header: "Téléphone", accessorFn: (row) => row.telephone || "—" },
    { header: "Département", accessorKey: "departement", enableSorting: true },
    {
      header: "Rôle",
      accessorKey: "role",
      enableSorting: true,
      cell: ({ row }) => <Badge variant="brand">{roleLabel[row.original.role]}</Badge>,
    },
    {
      header: "Statut",
      accessorKey: "statut_actuel",
      enableSorting: true,
      cell: ({ row }) => <Badge variant={statutBadgeVariant(row.original.statut_actuel)}>{statutLabel[row.original.statut_actuel] ?? row.original.statut_actuel}</Badge>,
    },
    {
      header: "Compte",
      accessorKey: "actif",
      cell: ({ row }) => <Badge variant={row.original.actif ? "success" : "danger"}>{row.original.actif ? "Actif" : "Inactif"}</Badge>,
    },
    {
      header: "Appareil",
      cell: ({ row }) => {
        const a = row.original.appareil
        return <span className="text-sm text-muted-foreground">{a ? `${a.marque ?? ""} ${a.modele}` : "—"}</span>
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Link href={`/dashboard/employes/${row.original.id}`}>
            <Button variant="outline" size="sm" className="h-7 text-[11px] px-2">Fiche</Button>
          </Link>
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={async () => {
            try {
              await toggleAccount.mutateAsync(row.original.id)
              toast.success(row.original.actif ? "Compte désactivé" : "Compte réactivé")
            } catch { toast.error("Erreur") }
          }}>{row.original.actif ? "Désactiver" : "Réactiver"}</Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 border-warning text-warning-foreground hover:bg-warning" onClick={async () => {
            try {
              const result = await resetPin.mutateAsync(row.original.id)
              toast.success(result?.newPin ? `PIN : ${result.newPin}` : "PIN réinitialisé")
            } catch { toast.error("Erreur") }
          }}>PIN</Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground"><Spinner /><span>Chargement des employés...</span></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Répertoire des employés</h2>
          <p className="text-sm text-muted-foreground">Gèrez les comptes, appareils associés et accès de pointage.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/employes/desactives"><Button variant="outline"><Users className="size-4" /> Désactivés</Button></Link>
          <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Nouvel employé</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total effectif" value={stats.total} variant="info" />
        <StatCard icon={CheckCircle2} label="Présents" value={stats.presents} variant="success" />
        <StatCard icon={Coffee} label="En pause" value={stats.enPause} variant="warning" />
        <StatCard icon={UserX} label="Absents / en congé" value={stats.absents} variant="danger" />
      </div>

      <EmployeeFilters
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        statut={filterStatut} setStatut={setFilterStatut}
        filterDepartement={filterDepartement} setFilterDepartement={setFilterDepartement}
        geofencing={filterGeofencing} setGeofencing={setFilterGeofencing}
        departements={departementsDisponibles}
      />

      <div className="flex gap-2">
        {(["actifs", "desactives", "tous"] as const).map((opt) => (
          <button key={opt} onClick={() => setFilterActif(opt)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${filterActif === opt ? "bg-brand text-white" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >{opt === "actifs" ? "Actifs" : opt === "desactives" ? "Désactivés" : "Tous"}</button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouvel employé" description="Formulaire simplifié pour la démonstration RH.">
        <div className="grid gap-4">
          {(["nom", "prenom", "email"] as const).map((field) => (
            <div key={field}>
              <Input placeholder={field === "nom" ? "Nom" : field === "prenom" ? "Prénom" : "Email"} type={field === "email" ? "email" : "text"}
                value={form[field]} onChange={(e) => { setForm((prev) => ({ ...prev, [field]: e.target.value })); setFormErrors((prev) => ({ ...prev, [field]: "" })) }} />
              {formErrors[field] && <p className="mt-1 text-xs text-destructive">{formErrors[field]}</p>}
            </div>
          ))}
          <Input placeholder="Téléphone" type="tel" value={form.telephone} onChange={(e) => setForm((prev) => ({ ...prev, telephone: e.target.value }))} />
          {isAdmin && (
            <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
              <option value="employe">Employé</option>
              <option value="gestionnaire">Gestionnaire</option>
              <option value="admin">Admin</option>
            </select>
          )}
          <select value={form.departement} onChange={(e) => setForm((prev) => ({ ...prev, departement: e.target.value }))}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
            {departementsDisponibles.map((departement) => (<option key={departement} value={departement}>{departement}</option>))}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createEmployee.isPending}>Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}