"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useRequests() {
  return useQuery({
    queryKey: ["requests"],
    queryFn: () => api.getRequests(),
  })
}

export function usePendingRequestsCount() {
  return useQuery<{ count: number }>({
    queryKey: ["pending-requests"],
    queryFn: () => api.getPendingRequests(),
  })
}

export function useProcessRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, commentaire }: { id: string; action: string; commentaire?: string }) =>
      api.processRequest(id, action, commentaire),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] })
      qc.invalidateQueries({ queryKey: ["pending-requests"] })
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}
