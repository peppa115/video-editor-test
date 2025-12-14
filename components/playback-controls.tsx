"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"

interface PlaybackControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onSkipBackward: () => void
  onSkipForward: () => void
  currentTime: number
  duration: number
}

export function PlaybackControls({
  isPlaying,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  currentTime,
  duration,
}: PlaybackControlsProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
      {/* Skip backward */}
      <Button variant="ghost" size="sm" onClick={onSkipBackward} className="hover:bg-accent/20">
        <SkipBack className="w-4 h-4" />
      </Button>

      {/* Play/Pause */}
      <Button variant="default" size="sm" onClick={onPlayPause} className="bg-primary hover:bg-primary/80">
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>

      {/* Skip forward */}
      <Button variant="ghost" size="sm" onClick={onSkipForward} className="hover:bg-accent/20">
        <SkipForward className="w-4 h-4" />
      </Button>

      {/* Time display */}
      <div className="flex items-center gap-2 ml-4 font-mono text-sm">
        <span className="text-foreground">{formatTime(currentTime)}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{formatTime(duration)}</span>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2 ml-auto">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <div className="w-20 h-1 bg-muted rounded-full">
          <div className="w-3/4 h-full bg-accent rounded-full" />
        </div>
      </div>
    </div>
  )
}
