"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { ParametresSysteme } from "@/lib/types"

export function useSettings() {
  return useQuery<ParametresSysteme>({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(),
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings: ParametresSysteme) => api.updateSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] })
    },
  })
}
