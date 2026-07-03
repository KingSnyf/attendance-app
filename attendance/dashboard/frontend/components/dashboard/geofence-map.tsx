"use client"
import { MapPin } from "lucide-react"

type GeofenceMapProps = {
  center: { lat: number; lng: number }
  radius: number
  lastPosition?: { lat: number; lng: number; date: string } | null
}

function GeofenceMap({ center, radius, lastPosition }: GeofenceMapProps) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl bg-muted">
      <div className="text-center text-muted-foreground">
        <MapPin className="mx-auto size-8" />
        <p className="mt-2 text-sm font-medium">Carte interactive</p>
        <p className="mt-1 text-xs">
          Centre: {center.lat}, {center.lng} | Rayon: {radius}m
        </p>
        {lastPosition && (
          <p className="text-xs">
            Dernière position: {lastPosition.lat}, {lastPosition.lng}
          </p>
        )}
      </div>
    </div>
  )
}

export { GeofenceMap }
