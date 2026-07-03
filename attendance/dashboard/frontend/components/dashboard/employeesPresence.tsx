"use client"
import { Badge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"

type EmployeeRow = {
  id: string
  nom: string
  prenom: string
  email: string
  departement: string
  statut_actuel: string
  geofencing_alert?: boolean
  premiere_arrivee?: string | null
  temps_cumule?: string | null
}

type EmployeesPresenceProps = {
  employees: EmployeeRow[]
  onViewEmployee: (id: string) => void
}

function badgeVariant(statut: string) {
  if (statut === "present") return "success"
  if (statut === "pause") return "warning"
  if (statut === "absent") return "danger"
  return "info"
}

function EmployeesPresence({ employees, onViewEmployee }: EmployeesPresenceProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left">
          <tr>
            <th className="pb-3 text-xs font-medium uppercase text-muted-foreground">Employé</th>
            <th className="pb-3 text-xs font-medium uppercase text-muted-foreground">Département</th>
            <th className="pb-3 text-xs font-medium uppercase text-muted-foreground">Statut</th>
            <th className="pb-3 text-xs font-medium uppercase text-muted-foreground">Arrivée</th>
            <th className="pb-3 text-xs font-medium uppercase text-muted-foreground">Temps</th>
            <th className="pb-3 text-xs font-medium uppercase text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} className="border-b border-border">
              <td className="py-3 pr-4">
                <div>
                  <p className="font-medium text-foreground">{employee.prenom} {employee.nom}</p>
                  <p className="text-xs text-muted-foreground">{employee.email}</p>
                </div>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{employee.departement}</td>
              <td className="py-3 pr-4">
                <Badge variant={badgeVariant(employee.statut_actuel)}>
                  {employee.statut_actuel}
                </Badge>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{employee.premiere_arrivee ?? "—"}</td>
              <td className="py-3 pr-4 text-muted-foreground">{employee.temps_cumule ?? "—"}</td>
              <td className="py-3">
                <Button variant="outline" size="sm" onClick={() => onViewEmployee(employee.id)}>
                  Voir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { EmployeesPresence }
