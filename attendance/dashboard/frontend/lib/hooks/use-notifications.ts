"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Anomalie } from "@/lib/types"

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const anomalies = await api.getAnomalies()
      const nonTraitees = (anomalies as Anomalie[]).filter((a) => !a.traitee).length

      let modifications = 0
      try {
        const list = await api.getModificationRequests()
        modifications = (list as any[]).filter((m) => m.statut === "en_attente").length
      } catch {}

      let requests = 0
      try {
        const r = await api.getPendingRequests()
        requests = r.count
      } catch {}

      return { anomalies: nonTraitees, modifications, requests }
    },
    refetchInterval: 30_000,
  })
}
