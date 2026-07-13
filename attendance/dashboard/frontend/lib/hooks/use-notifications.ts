"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Anomalie } from "@/lib/types"

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const [anomaliesRes, modificationsRes, pendingRes] = await Promise.allSettled([
        api.getAnomalies(),
        api.getModificationRequests(),
        api.getPendingRequests(),
      ])

      const anomalies = anomaliesRes.status === "fulfilled"
        ? (anomaliesRes.value as Anomalie[]).filter((a) => !a.traitee).length
        : 0
      const modifications = modificationsRes.status === "fulfilled"
        ? (modificationsRes.value as any[]).filter((m) => m.statut === "en_attente").length
        : 0
      const requests = pendingRes.status === "fulfilled"
        ? pendingRes.value.count
        : 0

      return { anomalies, modifications, requests }
    },
    refetchInterval: 30_000,
  })
}
