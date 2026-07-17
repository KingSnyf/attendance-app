"use client"
import { MapContainer, TileLayer, Circle, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type EmployeeMapProps = {
  officeCenter: { lat: number; lng: number }
  officeRadius: number
  insideCount: number
  outsideCount: number
}

function EmployeeMap({ officeCenter, officeRadius, insideCount, outsideCount }: EmployeeMapProps) {
  const coords: [number, number] = [officeCenter.lat, officeCenter.lng]

  return (
    <div className="h-80 overflow-hidden rounded-2xl relative">
      <MapContainer center={coords} zoom={15} scrollWheelZoom={true} className="size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle center={coords} radius={officeRadius} pathOptions={{ color: "#f97316", fillOpacity: 0.1 }}>
          <Tooltip permanent direction="center">Zone autorisée ({officeRadius}m)</Tooltip>
        </Circle>
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-[1000] flex gap-3 rounded-xl bg-white/95 px-3 py-2 text-xs shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-green-500" />
          {insideCount} dans la zone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-red-500" />
          {outsideCount} hors zone
        </span>
      </div>
    </div>
  )
}

export default EmployeeMap
