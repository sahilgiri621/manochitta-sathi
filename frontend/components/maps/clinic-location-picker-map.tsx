"use client"

import { useEffect } from "react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import { getClinicMarkerIcon } from "./leaflet-marker"
import type { ClinicLocationValue } from "./clinic-location-picker"

const DEFAULT_CENTER: [number, number] = [27.7172, 85.324]

function LocationMarker({
  value,
  onChange,
}: {
  value: ClinicLocationValue | null
  onChange: (value: ClinicLocationValue) => void
}) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      })
    },
  })

  if (!value) return null

  return (
    <Marker
      draggable
      icon={getClinicMarkerIcon()}
      position={[value.latitude, value.longitude]}
      eventHandlers={{
        dragend(event) {
          const marker = event.target
          const position = marker.getLatLng()
          onChange({
            latitude: Number(position.lat.toFixed(6)),
            longitude: Number(position.lng.toFixed(6)),
          })
        },
      }}
    />
  )
}

function MapViewport({ value }: { value: ClinicLocationValue | null }) {
  const map = useMap()

  useEffect(() => {
    if (!value) return
    map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 15))
  }, [map, value])

  return null
}

export default function ClinicLocationPickerMap({
  value,
  onChange,
}: {
  value: ClinicLocationValue | null
  onChange: (value: ClinicLocationValue) => void
}) {
  return (
    <MapContainer
      center={value ? [value.latitude, value.longitude] : DEFAULT_CENTER}
      zoom={value ? 15 : 13}
      scrollWheelZoom
      className="h-[320px] w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport value={value} />
      <LocationMarker value={value} onChange={onChange} />
    </MapContainer>
  )
}
