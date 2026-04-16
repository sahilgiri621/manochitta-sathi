"use client"

import dynamic from "next/dynamic"

const ClinicDisplayMapInner = dynamic(() => import("./clinic-display-map-inner"), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-xl border border-border bg-muted/40" />,
})

export function ClinicDisplayMap(props: { latitude: number; longitude: number }) {
  return <ClinicDisplayMapInner {...props} />
}
