"use client"

import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut } from "lucide-react"

interface TimelineZoomControlProps {
  zoomLevel: number
  onZoomChange: (zoom: number) => void
}

export function TimelineZoomControl({ zoomLevel, onZoomChange }: TimelineZoomControlProps) {
  const handleZoomChange = (value: number[]) => {
    onZoomChange(value[0])
  }

  const getZoomLabel = (zoom: number) => {
    const timePerGrid = zoom/10 // 0.5s to 10s
    return `${timePerGrid}s/grid`
  }

  return (
    <div className="flex items-center gap-3 bg-card/50 border border-border rounded-lg p-3">
      <ZoomOut className="w-4 h-4 text-muted-foreground" />
      <div className="flex items-center gap-2 min-w-[200px]">
        <Slider value={[zoomLevel]} onValueChange={handleZoomChange} max={50} min={1} step={1} className="flex-1" />
        <span className="text-xs text-muted-foreground font-mono min-w-[60px]">{getZoomLabel(zoomLevel)}</span>
      </div>
      <ZoomIn className="w-4 h-4 text-muted-foreground" />
    </div>
  )
}
