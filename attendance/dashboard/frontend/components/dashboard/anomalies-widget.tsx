"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { useAnomalies, useResolveAnomaly } from "@/lib/hooks/use-anomalies"
import { anomalieTypeLabel } from "@/lib/labels"
import { getNomComplet } from "@/lib/utils"
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
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
          <CheckCircle2 className="size-6" />
        </span>
        <div>
          <p className="font-medium text-foreground">Tout est sous contrôle</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucune anomalie n'attend d'être traitée.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal">
          <AlertTriangle className="size-5" />
        </span>
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {nonTraitees.length} anomalie{nonTraitees.length > 1 ? "s" : ""} à traiter — triées par criticité
          </p>
          <ul className="mt-3 divide-y divide-border">
            {nonTraitees.map((anomalie) => {
              const criticite = anomalie.criticite ?? "faible"
              return (
                <li
                  key={anomalie.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
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