"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronDown, MoreHorizontal, Plus, Search, SlidersHorizontal } from "lucide-react"
import toast from "react-hot-toast"
import { Avatar } from "@/components/dashboard/avatar"
import { Spinner } from "@/components/ui/spinner"
import { useEmployees, useResetPin, useToggleAccount } from "@/lib/hooks/use-employees"
import { getNomComplet } from "@/lib/utils"
import { roleLabel, statutLabel } from "@/lib/labels"

export default function EmployesPage() {
  const { data: employees = [], isLoading, error } = useEmployees()
  const toggleAccount = useToggleAccount()
  const resetPin = useResetPin()
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState("all")
  const [status, setStatus] = useState("all")
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const departments = useMemo(() => [...new Set(employees.map((employee) => employee.departement).filter(Boolean))].sort(), [employees])
  const filtered = useMemo(() => employees.filter((employee) => {
    const needle = query.trim().toLowerCase()
    return (!needle || getNomComplet(employee).toLowerCase().includes(needle) || employee.email.toLowerCase().includes(needle))
      && (department === "all" || employee.departement === department)
      && (status === "all" || employee.statut_actuel === status)
  }), [employees, query, department, status])

  if (isLoading) return <div className="flex min-h-[55vh] items-center justify-center gap-3 text-[#7d8496]"><Spinner /> Chargement des employés...</div>
  if (error) return <div className="p-6 text-sm text-red-600">Impossible de charger les employés.</div>

  return (
    <div className="mx-auto max-w-362.5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] text-[#8a91a3]">Tableau de bord / Employés</p>
          <h1 className="text-lg font-semibold text-[#111a35]">Employés</h1>
        </div>
        <Link href="/dashboard/employes/nouveau" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#5363dc] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#4352c7]">
          <Plus className="size-4" /> Ajouter un profil
        </Link>
      </div>

      <section className="overflow-visible rounded-lg border border-[#e1e5eb] bg-white shadow-[0_2px_10px_rgba(31,42,68,.04)]">
        <div className="flex flex-col gap-3 border-b border-[#eef0f3] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-[#9298a8]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par nom ou email" className="h-9 w-full rounded-md border border-[#dfe3e9] pl-9 pr-3 text-xs outline-none focus:border-[#5363dc]" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] text-[#8a91a3]"><SlidersHorizontal className="size-3.5" /> Filtres</div>
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-9 rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px] text-[#454d61]">
              <option value="all">Tous les départements</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px] text-[#454d61]">
              <option value="all">Tous les statuts</option>
              <option value="present">Présent</option>
              <option value="en_attente">En pause</option>
              <option value="absent">Absent</option>
              <option value="conge">En congé</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-237.5 border-collapse">
            <thead>
              <tr className="border-b border-[#e9ecf1] text-left text-[10px] font-medium text-[#8a91a3]">
                <th className="w-10 px-5 py-3"><input type="checkbox" aria-label="Tout sélectionner" /></th>
                <th className="px-3 py-3">Employé</th>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Département</th>
                <th className="px-3 py-3">Rôle</th>
                <th className="px-3 py-3">Téléphone</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3">Compte</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id} className="border-b border-[#eef0f3] text-[11px] text-[#596174] last:border-0 hover:bg-[#fafbfc]">
                  <td className="px-5 py-3.5"><input type="checkbox" aria-label={`Sélectionner ${getNomComplet(employee)}`} /></td>
                  <td className="px-3 py-3.5">
                    <Link href={`/dashboard/employes/${employee.id}`} className="flex items-center gap-3">
                      <Avatar nom={getNomComplet(employee)} src={employee.photo_url} size="sm" />
                      <div><p className="font-semibold text-[#17203a]">{getNomComplet(employee)}</p><p className="text-[9px] text-[#9096a5]">{employee.email}</p></div>
                    </Link>
                  </td>
                  <td className="font-data px-3 py-3.5 text-[10px]">{employee.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-3 py-3.5">{employee.departement || "-"}</td>
                  <td className="px-3 py-3.5">{roleLabel[employee.role]}</td>
                  <td className="font-data px-3 py-3.5">{employee.telephone || "-"}</td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex items-center gap-2"><span className={`size-1.5 rounded-full ${employee.statut_actuel === "present" ? "bg-[#5363dc]" : employee.statut_actuel === "en_attente" ? "bg-[#55c4df]" : "bg-[#c5c9d2]"}`} />{statutLabel[employee.statut_actuel] ?? employee.statut_actuel}</span>
                  </td>
                  <td className="px-3 py-3.5"><span className={employee.actif ? "text-[#279a79]" : "text-[#d35b65]"}>{employee.actif ? "Actif" : "Inactif"}</span></td>
                  <td className="relative px-5 py-3.5 text-right">
                    <button onClick={() => setActiveMenu(activeMenu === employee.id ? null : employee.id)} className="rounded-md p-2 text-[#7c8394] hover:bg-[#eef1f5]" aria-label="Actions"><MoreHorizontal className="size-4" /></button>
                    {activeMenu === employee.id && (
                      <div className="absolute right-5 top-11 z-20 w-40 rounded-md border border-[#e1e5eb] bg-white p-1 text-left shadow-xl">
                        <Link href={`/dashboard/employes/${employee.id}`} className="block rounded px-3 py-2 text-[11px] hover:bg-[#f3f5f8]">Voir la fiche</Link>
                        <button className="block w-full rounded px-3 py-2 text-left text-[11px] hover:bg-[#f3f5f8]" onClick={async () => {
                          try {
                            await toggleAccount.mutateAsync(employee.id)
                            toast.success(employee.actif ? "Compte désactivé." : "Compte réactivé.")
                          } catch { toast.error("Action impossible.") }
                        }}>{employee.actif ? "Désactiver" : "Réactiver"}</button>
                        <button className="block w-full rounded px-3 py-2 text-left text-[11px] hover:bg-[#f3f5f8]" onClick={async () => {
                          try {
                            const result = await resetPin.mutateAsync(employee.id)
                            toast.success(`Nouveau PIN : ${result?.newPin ?? "-"}`, { duration: 8000 })
                          } catch { toast.error("Réinitialisation impossible.") }
                        }}>Réinitialiser le PIN</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#eef0f3] px-5 py-3 text-[10px] text-[#8a91a3]">
          <span>{filtered.length} employé(s)</span>
          <button className="flex items-center gap-1 text-[#4d566b]">20 par page <ChevronDown className="size-3" /></button>
        </div>
      </section>
    </div>
  )
}
