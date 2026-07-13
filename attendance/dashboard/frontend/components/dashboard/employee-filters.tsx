"use client"
import { Input } from "@/components/ui/input"

type EmployeeFiltersProps = {
  searchQuery: string
  setSearchQuery: (value: string) => void
  statut: string
  setStatut: (value: string) => void
  filterDepartement: string
  setFilterDepartement: (value: string) => void
  geofencing?: string
  setGeofencing?: (value: string) => void
  departements: string[]
}

function EmployeeFilters({
  searchQuery,
  setSearchQuery,
  statut,
  setStatut,
  filterDepartement,
  setFilterDepartement,
  geofencing,
  setGeofencing,
  departements,
}: EmployeeFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      <Input
        placeholder="Rechercher un employé..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <select
        value={statut}
        onChange={(e) => setStatut(e.target.value)}
        className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
      >
        <option value="all">Tous les statuts</option>
        <option value="present">Présent</option>
        <option value="en_attente">En pause</option>
        <option value="absent">Absent</option>
      </select>
      <select
        value={filterDepartement}
        onChange={(e) => setFilterDepartement(e.target.value)}
        className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
      >
        <option value="all">Tous les départements</option>
        {departements.map((dept) => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </select>
      {geofencing !== undefined && setGeofencing !== undefined && (
        <select
          value={geofencing}
          onChange={(e) => setGeofencing(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="all">Tous (géofencing)</option>
          <option value="alert">Alerte seulement</option>
          <option value="safe">Sans alerte</option>
        </select>
      )}
    </div>
  )
}

export { EmployeeFilters }