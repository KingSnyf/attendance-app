"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { DemandeModification } from "@/lib/types"

export function useModificationRequests() {
  return useQuery<DemandeModification[]>({
    queryKey: ["modification-requests"],
    queryFn: () => api.getModificationRequests() as Promise<DemandeModification[]>,
  })
}

export function useProcessModification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      action === "approve" ? api.approveRequest(id) : api.rejectRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modification-requests"] })
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useCreateModificationRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { gestionnaireId: string; sessionPresenceId: string; modificationProposee: string; raison: string }) =>
      api.createModificationRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modification-requests"] })
    },
  })
}
