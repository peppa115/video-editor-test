"use client"

import type React from "react"

import { useRef, useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"

interface VideoClip {
  id: string
  src: string
  name: string
  start: number
  end: number
  duration: number
  offset: number
}

interface TimelineProps {
  duration: number
  currentTime: number
  onTimeChange: (time: number) => void
  trackStart: number
  trackEnd: number
  onTrackChange: (start: number, end: number) => void
  videoSrc?: string
  videoClips: VideoClip[] // Added video clips prop
  zoomLevel: number
}

export function Timeline({
  duration,
  currentTime,
  onTimeChange,
  trackStart,
  trackEnd,
  onTrackChange,
  videoSrc,
  videoClips, // Added video clips prop
  zoomLevel,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  const [isDraggingTrackStart, setIsDraggingTrackStart] = useState(false)
  const [isDraggingTrackEnd, setIsDraggingTrackEnd] = useState(false)
  const [videoFrames, setVideoFrames] = useState<string[]>([])
  const [clipFrames, setClipFrames] = useState<Record<string, string[]>>({}) // Added clip frames state
  const videoRef = useRef<HTMLVideoElement>(null)

  const getTimePerGrid = useCallback(() => {
    return zoomLevel / 10
  }, [zoomLevel])

  const getVisibleDuration = useCallback(() => {
    const timePerGrid = getTimePerGrid()
    const gridsVisible = 10 // Show 20 grids at a time
    return timePerGrid * gridsVisible
  }, [getTimePerGrid])

  const getScrollOffset = useCallback(() => {
    const visibleDuration = getVisibleDuration()
    const centerTime = currentTime
    return Math.max(0, centerTime - visibleDuration / 2)
  }, [currentTime, getVisibleDuration])

  useEffect(() => {
    if (!videoSrc || duration === 0) return

    const extractFrames = async () => {
      const video = document.createElement("video")
      video.src = videoSrc
      video.crossOrigin = "anonymous"

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const frames: string[] = []
      const frameCount = Math.min(50, Math.max(20, Math.floor(duration / getTimePerGrid())))

      video.addEventListener("loadedmetadata", () => {
        canvas.width = 160
        canvas.height = 90

        const extractFrame = (time: number) => {
          return new Promise<string>((resolve) => {
            video.currentTime = time
            video.addEventListener(
              "seeked",
              () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL("image/jpeg", 0.8))
              },
              { once: true },
            )
          })
        }

        const extractAllFrames = async () => {
          for (let i = 0; i < frameCount; i++) {
            const time = (duration / frameCount) * i
            const frameData = await extractFrame(time)
            frames.push(frameData)
          }
          setVideoFrames(frames)
        }

        extractAllFrames()
      })

      video.load()
    }

    extractFrames()
  }, [videoSrc, duration, getTimePerGrid])

  useEffect(() => {
    const extractClipFrames = async () => {
      const newClipFrames: Record<string, string[]> = {}

      for (const clip of videoClips) {
        if (clipFrames[clip.id]) continue // Skip if already extracted

        const video = document.createElement("video")
        video.src = clip.src
        video.crossOrigin = "anonymous"

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) continue

        const frames: string[] = []
        const frameCount = Math.min(20, Math.max(10, Math.floor(clip.duration / getTimePerGrid())))

        await new Promise<void>((resolve) => {
          video.addEventListener("loadedmetadata", async () => {
            canvas.width = 160
            canvas.height = 90

            const extractFrame = (time: number) => {
              return new Promise<string>((frameResolve) => {
                video.currentTime = time
                video.addEventListener(
                  "seeked",
                  () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                    frameResolve(canvas.toDataURL("image/jpeg", 0.8))
                  },
                  { once: true },
                )
              })
            }

            for (let i = 0; i < frameCount; i++) {
              const time = (clip.duration / frameCount) * i
              const frameData = await extractFrame(time)
              frames.push(frameData)
            }

            newClipFrames[clip.id] = frames
            resolve()
          })

          video.load()
        })
      }

      setClipFrames((prev) => ({ ...prev, ...newClipFrames }))
    }

    if (videoClips.length > 0) {
      extractClipFrames()
    }
  }, [videoClips, getTimePerGrid])

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!timelineRef.current) return 0
      const rect = timelineRef.current.getBoundingClientRect()
      const position = (clientX - rect.left) / rect.width
      const visibleDuration = getVisibleDuration()
      const scrollOffset = getScrollOffset()
      return Math.max(0, Math.min(duration, scrollOffset + position * visibleDuration))
    },
    [duration, getVisibleDuration, getScrollOffset],
  )

  const getPositionFromTime = useCallback(
    (time: number) => {
      const visibleDuration = getVisibleDuration()
      const scrollOffset = getScrollOffset()
      const relativeTime = time - scrollOffset
      return visibleDuration > 0 ? (relativeTime / visibleDuration) * 100 : 0
    },
    [getVisibleDuration, getScrollOffset],
  )

  const handleMouseDown = useCallback((e: React.MouseEvent, type: "playhead" | "track-start" | "track-end") => {
    e.preventDefault()

    switch (type) {
      case "playhead":
        setIsDraggingPlayhead(true)
        break
      case "track-start":
        setIsDraggingTrackStart(true)
        break
      case "track-end":
        setIsDraggingTrackEnd(true)
        break
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingPlayhead && !isDraggingTrackStart && !isDraggingTrackEnd) return

      const newTime = getTimeFromPosition(e.clientX)

      if (isDraggingPlayhead) {
        onTimeChange(Math.max(trackStart, Math.min(trackEnd, newTime)))
      } else if (isDraggingTrackStart) {
        onTrackChange(Math.min(newTime, trackEnd - 0.1), trackEnd)
      } else if (isDraggingTrackEnd) {
        onTrackChange(trackStart, Math.max(newTime, trackStart + 0.1))
      }
    },
    [
      isDraggingPlayhead,
      isDraggingTrackStart,
      isDraggingTrackEnd,
      getTimeFromPosition,
      onTimeChange,
      onTrackChange,
      trackStart,
      trackEnd,
    ],
  )

  const handleMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false)
    setIsDraggingTrackStart(false)
    setIsDraggingTrackEnd(false)
  }, [])

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingPlayhead || isDraggingTrackStart || isDraggingTrackEnd) return

      const newTime = getTimeFromPosition(e.clientX)
      onTimeChange(Math.max(trackStart, Math.min(trackEnd, newTime)))
    },
    [
      isDraggingPlayhead,
      isDraggingTrackStart,
      isDraggingTrackEnd,
      getTimeFromPosition,
      onTimeChange,
      trackStart,
      trackEnd,
    ],
  )

  useEffect(() => {
    if (isDraggingPlayhead || isDraggingTrackStart || isDraggingTrackEnd) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDraggingPlayhead, isDraggingTrackStart, isDraggingTrackEnd, handleMouseMove, handleMouseUp])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const generateTimeMarkers = () => {
    const markers = []
    const timePerGrid = getTimePerGrid()
    const visibleDuration = getVisibleDuration()
    const scrollOffset = getScrollOffset()

    // Calculate the start and end times for visible area
    const startTime = Math.floor(scrollOffset / timePerGrid) * timePerGrid
    const endTime = scrollOffset + visibleDuration

    for (let i = startTime; i <= endTime; i += timePerGrid) {
      const position = getPositionFromTime(i)
      if (position >= -5 && position <= 105) {
        // Only render visible markers
        markers.push(
          <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: `${position}%` }}>
            <div className="w-px h-3 bg-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1 font-mono">{formatTime(i)}</span>
          </div>,
        )
      }
    }

    return markers
  }

  return (
    <div className="w-full bg-timeline-bg border border-border rounded-lg p-4">
      {/* Time markers */}
      <div className="relative h-8 mb-4">{generateTimeMarkers()}</div>

      {/* Main timeline */}
      <div
        ref={timelineRef}
        className="relative h-16 bg-timeline-track rounded cursor-pointer overflow-hidden"
        onClick={handleTimelineClick}
      >
        {videoFrames.length > 0 && videoClips.length === 0 && (
          <div className="absolute inset-0 flex">
            {videoFrames.map((frame, index) => {
              const frameTime = (duration / videoFrames.length) * index
              const framePosition = getPositionFromTime(frameTime)
              const frameWidth = 100 / videoFrames.length

              if (framePosition > -frameWidth && framePosition < 100 + frameWidth) {
                return (
                  <div
                    key={index}
                    className="absolute h-full bg-cover bg-center opacity-60"
                    style={{
                      left: `${framePosition}%`,
                      width: `${frameWidth}%`,
                      backgroundImage: `url(${frame})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )
              }
              return null
            })}
          </div>
        )}

        {videoClips.map((clip) => {
          const clipFramesData = clipFrames[clip.id] || []
          if (clipFramesData.length === 0) return null

          const clipStartPosition = getPositionFromTime(clip.offset)
          const clipWidth = (clip.duration / getVisibleDuration()) * 100

          // Only render if clip is visible
          if (clipStartPosition > -clipWidth && clipStartPosition < 100 + clipWidth) {
            return (
              <div
                key={clip.id}
                className="absolute inset-y-0 flex"
                style={{
                  left: `${clipStartPosition}%`,
                  width: `${clipWidth}%`,
                }}
              >
                {clipFramesData.map((frame, index) => {
                  const frameWidth = 100 / clipFramesData.length
                  return (
                    <div
                      key={`${clip.id}-${index}`}
                      className="h-full bg-cover bg-center opacity-60"
                      style={{
                        width: `${frameWidth}%`,
                        backgroundImage: `url(${frame})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  )
                })}
              </div>
            )
          }
          return null
        })}

        {/* Track selection area */}
        <div
          className="absolute top-0 h-full bg-accent/30 border-2 border-accent rounded"
          style={{
            left: `${getPositionFromTime(trackStart)}%`,
            width: `${getPositionFromTime(trackEnd) - getPositionFromTime(trackStart)}%`,
          }}
        />

        {/* Track start handle */}
        <div
          className={cn(
            "absolute top-0 w-3 h-full bg-accent rounded-l cursor-ew-resize hover:bg-accent/80 transition-colors z-10",
            isDraggingTrackStart && "bg-accent/80",
          )}
          style={{ left: `${getPositionFromTime(trackStart)}%` }}
          onMouseDown={(e) => handleMouseDown(e, "track-start")}
        />

        {/* Track end handle */}
        <div
          className={cn(
            "absolute top-0 w-3 h-full bg-accent rounded-r cursor-ew-resize hover:bg-accent/80 transition-colors z-10",
            isDraggingTrackEnd && "bg-accent/80",
          )}
          style={{ left: `${getPositionFromTime(trackEnd) - 1.5}%` }}
          onMouseDown={(e) => handleMouseDown(e, "track-end")}
        />

        {/* Playhead */}
        <div
          className={cn(
            "absolute top-0 w-1 h-full bg-playhead cursor-ew-resize hover:w-2 transition-all z-20",
            isDraggingPlayhead && "w-2",
          )}
          style={{ left: `${getPositionFromTime(currentTime)}%` }}
          onMouseDown={(e) => handleMouseDown(e, "playhead")}
        >
          {/* Playhead indicator */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-playhead" />
        </div>
      </div>

      {/* Time display */}
      <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}
