"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Edit3 } from "lucide-react"

interface Subtitle {
  id: string
  start: number
  end: number
  text: string
}

interface SubtitleTrackProps {
  duration: number
  currentTime: number
  subtitles: Subtitle[]
  onSubtitlesChange: (subtitles: Subtitle[]) => void
  trackStart: number
  trackEnd: number
  zoomLevel: number
}

export function SubtitleTrack({
  duration,
  currentTime,
  subtitles,
  onSubtitlesChange,
  trackStart,
  trackEnd,
  zoomLevel,
}: SubtitleTrackProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const trackRef = useRef<HTMLDivElement>(null)

  // Calculate zoom scale (0.5s to 10s per grid)
  const secondsPerGrid = 0.5 + (zoomLevel / 100) * 9.5
  const pixelsPerSecond = 40 / secondsPerGrid

  const handleAddSubtitle = () => {
    const newSubtitle: Subtitle = {
      id: Date.now().toString(),
      start: Math.max(trackStart, currentTime),
      end: Math.min(trackEnd, currentTime + 3),
      text: "New subtitle",
    }
    onSubtitlesChange([...subtitles, newSubtitle])
  }

  const handleDeleteSubtitle = (id: string) => {
    onSubtitlesChange(subtitles.filter((sub) => sub.id !== id))
  }

  const handleEditSubtitle = (id: string, text: string) => {
    setEditingId(id)
    setEditText(text)
  }

  const handleSaveEdit = () => {
    if (editingId) {
      onSubtitlesChange(subtitles.map((sub) => (sub.id === editingId ? { ...sub, text: editText } : sub)))
      setEditingId(null)
      setEditText("") 
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  const handleSubtitleDrag = (id: string, newStart: number, newEnd: number) => {
    const constrainedStart = Math.max(trackStart, Math.min(trackEnd - 1, newStart))
    const constrainedEnd = Math.max(constrainedStart + 1, Math.min(trackEnd, newEnd))

    onSubtitlesChange(
      subtitles.map((sub) => (sub.id === id ? { ...sub, start: constrainedStart, end: constrainedEnd } : sub)),
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Subtitle Track</h3>
        <Button onClick={handleAddSubtitle} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Add Subtitle
        </Button>
      </div>

      {/* Subtitle timeline */}
      <div
        ref={trackRef}
        className="relative h-16 bg-muted rounded border overflow-hidden"
        style={{ width: `${duration * pixelsPerSecond}px`, minWidth: "100%" }}
      >
        {/* Track bounds indicator */}
        <div
          className="absolute top-0 bottom-0 bg-primary/20 border-l-2 border-r-2 border-primary"
          style={{
            left: `${trackStart * pixelsPerSecond}px`,
            width: `${(trackEnd - trackStart) * pixelsPerSecond}px`,
          }}
        />

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent z-20"
          style={{ left: `${currentTime * pixelsPerSecond}px` }}
        />

        {/* Subtitle blocks */}
        {subtitles.map((subtitle) => (
          <SubtitleBlock
            key={subtitle.id}
            subtitle={subtitle}
            pixelsPerSecond={pixelsPerSecond}
            isEditing={editingId === subtitle.id}
            editText={editText}
            onEditTextChange={setEditText}
            onEdit={() => handleEditSubtitle(subtitle.id, subtitle.text)}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onDelete={() => handleDeleteSubtitle(subtitle.id)}
            onDrag={handleSubtitleDrag}
          />
        ))}
      </div>

      {/* Subtitle list */}
      <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
        {subtitles.map((subtitle) => (
          <div key={subtitle.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground min-w-0 flex-shrink-0">
              {subtitle.start.toFixed(1)}s - {subtitle.end.toFixed(1)}s
            </span>
            <span className="flex-1 truncate">{subtitle.text}</span>
            <Button onClick={() => handleEditSubtitle(subtitle.id, subtitle.text)} size="sm" variant="ghost">
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button onClick={() => handleDeleteSubtitle(subtitle.id)} size="sm" variant="ghost">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SubtitleBlockProps {
  subtitle: Subtitle
  pixelsPerSecond: number
  isEditing: boolean
  editText: string
  onEditTextChange: (text: string) => void
  onEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onDrag: (id: string, newStart: number, newEnd: number) => void
}

function SubtitleBlock({
  subtitle,
  pixelsPerSecond,
  isEditing,
  editText,
  onEditTextChange,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onDrag,
}: SubtitleBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, startTime: 0, endTime: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      startTime: subtitle.start,
      endTime: subtitle.end,
    })
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x
      const deltaTime = deltaX / pixelsPerSecond

      onDrag(subtitle.id, dragStart.startTime + deltaTime, dragStart.endTime + deltaTime)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragStart, pixelsPerSecond, subtitle.id, onDrag])

  const left = subtitle.start * pixelsPerSecond
  const width = (subtitle.end - subtitle.start) * pixelsPerSecond

  return (
    <div
      className={`absolute top-1 bottom-1 bg-accent/80 border border-accent rounded cursor-move flex items-center px-2 text-xs text-accent-foreground ${
        isDragging ? "opacity-75" : ""
      }`}
      style={{ left: `${left}px`, width: `${Math.max(width, 60)}px` }}
      onMouseDown={handleMouseDown}
      onDoubleClick={onEdit}
    >
      <span className="truncate flex-1">{subtitle.text}</span>
      {isEditing && (
        <div className="absolute inset-0 bg-background border border-border rounded p-1 z-30">
          <Input
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="h-6 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit()
              if (e.key === "Escape") onCancelEdit()
            }}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
