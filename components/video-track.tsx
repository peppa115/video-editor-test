"use client"

import type React from "react"

import { useRef, useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"

interface VideoClip {
  id: string
  src: string
  name: string
  start: number
  end: number
  duration: number
  offset: number // Position in timeline
}

interface VideoTrackProps {
  duration: number
  currentTime: number
  clips: VideoClip[]
  onClipsChange: (clips: VideoClip[]) => void
  trackStart: number
  trackEnd: number
  zoomLevel: number
}

export function VideoTrack({
  duration,
  currentTime,
  clips,
  onClipsChange,
  trackStart,
  trackEnd,
  zoomLevel,
}: VideoTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [isDraggingEdge, setIsDraggingEdge] = useState<{ clipId: string; edge: "start" | "end" } | null>(null) // Added edge dragging state
  const [dragOffset, setDragOffset] = useState(0)

  const getTimePerGrid = useCallback(() => {
    return zoomLevel / 10
  }, [zoomLevel])

  const getVisibleDuration = useCallback(() => {
    const timePerGrid = getTimePerGrid()
    const gridsVisible = 10
    return timePerGrid * gridsVisible
  }, [getTimePerGrid])

  const getScrollOffset = useCallback(() => {
    const visibleDuration = getVisibleDuration()
    const centerTime = currentTime
    return Math.max(0, centerTime - visibleDuration / 2)
  }, [currentTime, getVisibleDuration])

  const getPositionFromTime = useCallback(
    (time: number) => {
      const visibleDuration = getVisibleDuration()
      const scrollOffset = getScrollOffset()
      const relativeTime = time - scrollOffset
      return visibleDuration > 0 ? (relativeTime / visibleDuration) * 100 : 0
    },
    [getVisibleDuration, getScrollOffset],
  )

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0
      const rect = trackRef.current.getBoundingClientRect()
      const position = (clientX - rect.left) / rect.width
      const visibleDuration = getVisibleDuration()
      const scrollOffset = getScrollOffset()
      return Math.max(0, Math.min(duration, scrollOffset + position * visibleDuration))
    },
    [duration, getVisibleDuration, getScrollOffset],
  )

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !file.type.startsWith("video/")) return

      const videoUrl = URL.createObjectURL(file)
      const video = document.createElement("video")

      video.addEventListener("loadedmetadata", () => {
        const newClip: VideoClip = {
          id: Date.now().toString(),
          src: videoUrl,
          name: file.name,
          start: 0,
          end: video.duration,
          duration: video.duration,
          offset: Math.max(trackStart, currentTime),
        }

        onClipsChange([...clips, newClip])
      })

      video.src = videoUrl
      event.target.value = ""
    },
    [clips, onClipsChange, trackStart, currentTime],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      e.preventDefault()
      setIsDragging(clipId)

      const clip = clips.find((c) => c.id === clipId)
      if (!clip) return

      const mouseTime = getTimeFromPosition(e.clientX)
      setDragOffset(mouseTime - clip.offset)
    },
    [clips, getTimeFromPosition],
  )

  const handleEdgeMouseDown = useCallback((e: React.MouseEvent, clipId: string, edge: "start" | "end") => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingEdge({ clipId, edge })
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const clip = clips.find((c) => c.id === isDragging)
        if (!clip) return

        const mouseTime = getTimeFromPosition(e.clientX)
        const newOffset = Math.max(trackStart, Math.min(trackEnd - clip.duration, mouseTime - dragOffset))

        const updatedClips = clips.map((c) => (c.id === isDragging ? { ...c, offset: newOffset } : c))
        onClipsChange(updatedClips)
      } else if (isDraggingEdge) {
        const clip = clips.find((c) => c.id === isDraggingEdge.clipId)
        if (!clip) return

        const mouseTime = getTimeFromPosition(e.clientX)

        if (isDraggingEdge.edge === "start") {
          const newStart = Math.max(0, Math.min(clip.end - 0.1, mouseTime - clip.offset))
          const updatedClips = clips.map((c) => (c.id === isDraggingEdge.clipId ? { ...c, start: newStart } : c))
          onClipsChange(updatedClips)
        } else {
          const newEnd = Math.max(clip.start + 0.1, Math.min(clip.duration, mouseTime - clip.offset))
          const updatedClips = clips.map((c) => (c.id === isDraggingEdge.clipId ? { ...c, end: newEnd } : c))
          onClipsChange(updatedClips)
        }
      }
    },
    [isDragging, isDraggingEdge, clips, getTimeFromPosition, trackStart, trackEnd, dragOffset, onClipsChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
    setIsDraggingEdge(null) // Reset edge dragging
    setDragOffset(0)
  }, [])

  useEffect(() => {
    if (isDragging || isDraggingEdge) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, isDraggingEdge, handleMouseMove, handleMouseUp])

  const deleteClip = useCallback(
    (clipId: string) => {
      const updatedClips = clips.filter((c) => c.id !== clipId)
      onClipsChange(updatedClips)
    },
    [clips, onClipsChange],
  )

  return (
    <div className="w-full bg-timeline-bg border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-foreground">Video Track</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-8 px-2">
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />

      <div ref={trackRef} className="relative h-16 bg-timeline-track rounded overflow-hidden">
        {clips.map((clip) => {
          const clipPosition = getPositionFromTime(clip.offset)
          const clipWidth = ((clip.end - clip.start) / getVisibleDuration()) * 100 // Use actual clip duration based on start/end

          if (clipPosition > -clipWidth && clipPosition < 100 + clipWidth) {
            return (
              <div
                key={clip.id}
                className={cn(
                  "absolute top-0 h-full bg-primary/80 border border-primary rounded cursor-move transition-all",
                  isDragging === clip.id && "bg-primary shadow-lg scale-105",
                )}
                style={{
                  left: `${clipPosition}%`,
                  width: `${clipWidth}%`,
                }}
                onMouseDown={(e) => handleMouseDown(e, clip.id)}
              >
                <div
                  className="absolute left-0 top-0 w-2 h-full bg-accent cursor-ew-resize hover:bg-accent/80 z-10"
                  onMouseDown={(e) => handleEdgeMouseDown(e, clip.id, "start")}
                />

                <div
                  className="absolute right-0 top-0 w-2 h-full bg-accent cursor-ew-resize hover:bg-accent/80 z-10"
                  onMouseDown={(e) => handleEdgeMouseDown(e, clip.id, "end")}
                />

                <div className="p-1 h-full flex flex-col justify-between">
                  <div className="text-xs text-primary-foreground font-medium truncate">{clip.name}</div>
                  <div className="text-xs text-primary-foreground/80">{Math.round(clip.end - clip.start)}s</div>
                </div>

                <button
                  className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteClip(clip.id)
                  }}
                >
                  ×
                </button>
              </div>
            )
          }
          return null
        })}

        {clips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Plus className="w-6 h-6 mx-auto mb-1" />
              <div className="text-xs">Add video clips</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
