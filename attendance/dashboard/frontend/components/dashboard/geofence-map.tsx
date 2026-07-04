"use client"
import { useEffect } from "react"
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet marker icon path with webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function MapUpdater({ center, radius }: { center: [number, number]; radius: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [map, center])
  return null
}

type GeofenceMapProps = {
  center: { lat: number; lng: number }
  radius: number
  lastPosition?: { lat: number; lng: number; date: string } | null
}

function GeofenceMap({ center, radius, lastPosition }: GeofenceMapProps) {
  const coords: [number, number] = [center.lat, center.lng]

  return (
    <div className="h-64 overflow-hidden rounded-2xl">
      <MapContainer
        center={coords}
        zoom={16}
        scrollWheelZoom={false}
        className="size-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={coords} radius={radius} />
        <Circle
          center={coords}
          radius={radius}
          pathOptions={{ color: "#f97316", fillOpacity: 0.15 }}
        />
        {lastPosition && (
          <Marker position={[lastPosition.lat, lastPosition.lng]}>
            <Popup>
              Dernière position connue
              <br />
              {new Date(lastPosition.date).toLocaleString("fr-FR")}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

export { GeofenceMap }
