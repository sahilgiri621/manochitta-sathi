"use client"

import { MapContainer, Marker, TileLayer } from "react-leaflet"
import { getClinicMarkerIcon } from "./leaflet-marker"

export default function ClinicDisplayMapInner({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={15} scrollWheelZoom className="h-[280px] w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={getClinicMarkerIcon()} />
    </MapContainer>
  )
}
