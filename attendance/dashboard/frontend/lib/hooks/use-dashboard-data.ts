"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { DashboardData } from "@/lib/types"

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboardData(),
  })
}
