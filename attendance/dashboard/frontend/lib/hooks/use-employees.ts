"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Utilisateur, EmployeDetail } from "@/lib/types"

export function useEmployees() {
  return useQuery<Utilisateur[]>({
    queryKey: ["employees"],
    queryFn: () => api.getEmployees(),
  })
}

export function useEmployeeDetail(id: string) {
  return useQuery<EmployeDetail | null>({
    queryKey: ["employee", id],
    queryFn: () => api.getEmployeeDetail(id),
    enabled: !!id,
  })
}
