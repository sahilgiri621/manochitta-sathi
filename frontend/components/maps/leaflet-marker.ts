"use client"

import L from "leaflet"

let clinicMarkerIcon: L.DivIcon | null = null

export function getClinicMarkerIcon() {
  if (clinicMarkerIcon) return clinicMarkerIcon

  clinicMarkerIcon = L.divIcon({
    className: "clinic-marker-icon",
    html: `
      <div style="position: relative; width: 22px; height: 22px;">
        <span style="position: absolute; inset: 0; border-radius: 9999px; background: #166534; border: 3px solid #ffffff; box-shadow: 0 10px 20px rgba(22, 101, 52, 0.28);"></span>
        <span style="position: absolute; left: 50%; top: 18px; width: 10px; height: 10px; background: #166534; transform: translateX(-50%) rotate(45deg); border-bottom-right-radius: 3px;"></span>
      </div>
    `,
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -24],
  })

  return clinicMarkerIcon
}
