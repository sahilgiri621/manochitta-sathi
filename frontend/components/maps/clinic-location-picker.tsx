"use client"

import dynamic from "next/dynamic"

const ClinicLocationPickerMap = dynamic(() => import("./clinic-location-picker-map"), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-xl border border-border bg-muted/40" />,
})

export interface ClinicLocationValue {
  latitude: number
  longitude: number
}

export function ClinicLocationPicker(props: {
  value: ClinicLocationValue | null
  onChange: (value: ClinicLocationValue) => void
}) {
  return <ClinicLocationPickerMap {...props} />
}
