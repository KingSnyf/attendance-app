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

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { nom: string; prenom: string; email: string; departement: string; telephone?: string; role?: string; isAdmin?: boolean }) =>
      data.isAdmin && data.role && data.role !== "employe"
        ? api.createUser({ nom: data.nom, prenom: data.prenom, email: data.email, role: data.role, departement: data.departement, telephone: data.telephone })
        : api.createEmployee(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }) },
  })
}

export function useToggleAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.toggleAccount(userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }) },
  })
}

export function useResetPin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.resetPin(userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }) },
  })
}
