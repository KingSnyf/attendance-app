"use client"
import { useEffect, useState } from "react"
import type { DashboardData } from "@/lib/types"

const MOCK_DATA: DashboardData = {
  stats: { presents: 5, absents: 2, enPause: 1, anomaliesNonTraitees: 3 },
  geofencingAlerts: [
    { id: "a1", type: "geofencing_incoherent", description: "Position hors périmètre", date_detection: "2026-07-03T08:45:00Z", user_id: "3", traitee: false, geoloc_verifiee: false },
    { id: "a2", type: "geofencing_incoherent", description: "Connexion depuis IP externe", date_detection: "2026-07-03T09:15:00Z", user_id: "5", traitee: false, geoloc_verifiee: false },
  ],
  employees: [],
  weeklyPresence: [
    { label: "Lun", presents: 6, absents: 2 },
    { label: "Mar", presents: 7, absents: 1 },
    { label: "Mer", presents: 5, absents: 3 },
    { label: "Jeu", presents: 8, absents: 0 },
    { label: "Ven", presents: 6, absents: 2 },
  ],
  monthlyPresence: [
    { label: "S1", presents: 30, absents: 5 },
    { label: "S2", presents: 32, absents: 3 },
    { label: "S3", presents: 28, absents: 7 },
    { label: "S4", presents: 35, absents: 0 },
  ],
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("attendance_token")
        if (!token || token === "mock-token-attendance") {
          setData(MOCK_DATA)
          setIsLoading(false)
          return
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002/api"}/sessions/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(3000),
        })
        if (res.ok) {
          const result = await res.json()
          setData(result)
        } else {
          setData(MOCK_DATA)
        }
      } catch {
        setData(MOCK_DATA)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return { data, isLoading, error }
}
