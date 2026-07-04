"use client"
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { DashboardData } from "@/lib/types"

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.getDashboardData()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Échec du chargement du dashboard"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, isLoading, error, refetch: load }
}