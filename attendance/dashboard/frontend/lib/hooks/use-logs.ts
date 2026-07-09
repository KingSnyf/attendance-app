"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { JournalActivite } from "@/lib/types"

export function useLogs() {
  return useQuery<JournalActivite[]>({
    queryKey: ["logs"],
    queryFn: () => api.getLogs() as Promise<JournalActivite[]>,
  })
}
