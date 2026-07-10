"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { useAnomalies, useResolveAnomaly } from "@/lib/hooks/use-anomalies"
import { anomalieTypeLabel } from "@/lib/labels"
import { getNomComplet } from "@/lib/data"
import toast from "react-hot-toast"

const CRITICITE_VARIANT = {
  critique: "danger",
  moyen: "warning",
  faible: "info",
} as const

const CRITICITE_LABEL = {
  critique: "Critique",
  moyen: "Moyen",
  faible: "Faible",
} as const

function AnomaliesWidget() {
  const { data: anomalies = [] } = useAnomalies()
  const resolveAnomaly = useResolveAnomaly()

  const nonTraitees = anomalies
    .filter((a) => !a.traitee)
    .slice(0, 5)

  if (nonTraitees.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success bg-success p-4">
        <CheckCircle2 className="size-5 shrink-0 text-success-foreground" />
        <p className="font-medium text-success-foreground">
          Aucune anomalie non traitée. Tout est sous contrôle.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-warning bg-warning p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
        <div className="flex-1">
          <p className="font-medium text-warning-foreground">
            {nonTraitees.length} anomalie{nonTraitees.length > 1 ? "s" : ""} à traiter — triées par criticité
          </p>
          <ul className="mt-3 space-y-2">
            {nonTraitees.map((anomalie) => {
              const criticite = anomalie.criticite ?? "faible"
              return (
                <li
                  key={anomalie.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-card/60 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={CRITICITE_VARIANT[criticite]}>
                        {CRITICITE_LABEL[criticite]}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        {anomalieTypeLabel[anomalie.type] ?? anomalie.type}
                      </span>
                      {anomalie.employe && (
                        <span className="text-sm text-muted-foreground">
                          — {getNomComplet(anomalie.employe)}
                        </span>
                      )}
                    </div>
                    {anomalie.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {anomalie.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resolveAnomaly.isPending}
                    onClick={async () => {
                      try {
                        await resolveAnomaly.mutateAsync({
                          id: anomalie.id,
                          comment: "Vérifiée depuis le tableau de bord",
                          geolocVerified: anomalie.type === "geofencing_incoherent",
                        })
                        toast.success("Anomalie marquée comme traitée.")
                      } catch {
                        toast.error("Échec du traitement de l'anomalie.")
                      }
                    }}
                  >
                    Vérifier
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

export { AnomaliesWidget }