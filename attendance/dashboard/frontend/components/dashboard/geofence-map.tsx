"use client"
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type GeofenceMapProps = {
  center: { lat: number; lng: number }
  radius: number
  lastPosition?: { lat: number; lng: number; date: string } | null
}

function GeofenceMap({ center, radius, lastPosition }: GeofenceMapProps) {
  return (
    <div className="h-64 overflow-hidden rounded-2xl">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={16}
        scrollWheelZoom={false}
        className="size-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[center.lat, center.lng]}
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
