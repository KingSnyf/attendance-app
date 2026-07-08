"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Anomalie } from "@/lib/types"
import toast from "react-hot-toast"

export function useAnomalies() {
  return useQuery<Anomalie[]>({
    queryKey: ["anomalies"],
    queryFn: () => api.getAnomalies(),
  })
}

export function useResolveAnomaly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment, geolocVerified }: { id: string; comment: string; geolocVerified: boolean }) =>
      api.resolveAnomaly(id, comment, geolocVerified),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anomalies"] })
      qc.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Anomalie traitée.")
    },
  })
}
