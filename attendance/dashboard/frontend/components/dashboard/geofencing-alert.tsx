"use client"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type GeofencingAlertProps = {
  anomalies_geofencing: Array<{ user_id: string; description?: string }>
  users: Array<{ id: string; prenom: string; nom: string }>
  onVerify: () => void
}

function GeofencingAlert({ anomalies_geofencing, users, onVerify }: GeofencingAlertProps) {
  if (anomalies_geofencing.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="font-medium text-amber-800">
            {anomalies_geofencing.length} alerte(s) géofencing
          </p>
          <ul className="mt-2 space-y-1">
            {anomalies_geofencing.slice(0, 5).map((alert, i) => {
              const user = users.find((u) => u.id === alert.user_id)
              return (
                <li key={i} className="text-sm text-amber-700">
                  {user ? `${user.prenom} ${user.nom}` : alert.user_id}
                  {alert.description ? ` — ${alert.description}` : ""}
                </li>
              )
            })}
          </ul>
          <Button variant="outline" size="sm" className="mt-3" onClick={onVerify}>
            <CheckCircle2 className="size-4" />
            Marquer comme vérifiée
          </Button>
        </div>
      </div>
    </div>
  )
}

export { GeofencingAlert }
