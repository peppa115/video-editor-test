"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"

interface VideoFrameTimelineProps {
  videoUrl: string
  trackHeight?: number
  frameWidth?: number
  className?: string
}

interface FrameCache {
  [key: number]: string // frame index -> data URL
}

export function VideoFrameTimeline({
  videoUrl,
  trackHeight = 120,
  frameWidth = 60,
  className = "",
}: VideoFrameTimelineProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [totalFrames, setTotalFrames] = useState(0)
  const [fps, setFps] = useState(30)
  const frameCache = useRef<FrameCache>({})
  const [frames, setFrames] = useState<string[]>([])
  const [isExtracting, setIsExtracting] = useState(false)

  const visibleFrameCount = useMemo(() => {
    if (containerWidth === 0) return 0
    return Math.ceil(containerWidth / frameWidth)
  }, [containerWidth, frameWidth])

  const frameIndices = useMemo(() => {
    if (totalFrames === 0 || visibleFrameCount === 0) return []

    const indices: number[] = []
    for (let i = 0; i < visibleFrameCount; i++) {
      // Evenly distribute frames across the video
      const frameIndex = Math.floor((totalFrames / visibleFrameCount) * (i + 1))
      indices.push(Math.min(frameIndex, totalFrames))
    }
    return indices
  }, [totalFrames, visibleFrameCount])

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        console.log("%c Line:55 🍒 entry.contentRect.width", "color:#93c0a4", entry.contentRect.width);
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      const duration = video.duration
      const estimatedFps = 30 // Default FPS, can be adjusted
      setFps(estimatedFps)
      setTotalFrames(Math.floor(duration * estimatedFps))
      setVideoLoaded(true)
      console.log("[v0] Video loaded:", { duration, estimatedFps, totalFrames: Math.floor(duration * estimatedFps) })
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata)
  }, [videoUrl])

  const extractFrame = useCallback(
    async (frameIndex: number): Promise<string> => {
      // Check cache first
      if (frameCache.current[frameIndex]) {
        return frameCache.current[frameIndex]
      }

      const video = videoRef.current
      if (!video) return ""

      return new Promise((resolve) => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve("")
          return
        }

        const seekToTime = frameIndex / fps

        const handleSeeked = () => {
          // Set canvas size to match video aspect ratio
          const aspectRatio = video.videoWidth / video.videoHeight
          canvas.height = trackHeight
          canvas.width = trackHeight * aspectRatio

          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Convert to data URL and cache
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
          frameCache.current[frameIndex] = dataUrl

          video.removeEventListener("seeked", handleSeeked)
          resolve(dataUrl)
        }

        video.addEventListener("seeked", handleSeeked)
        video.currentTime = seekToTime
      })
    },
    [fps, trackHeight],
  )

  useEffect(() => {
    if (!videoLoaded || frameIndices.length === 0 || isExtracting) return

    const extractAllFrames = async () => {
      setIsExtracting(true)
      console.log("[v0] Extracting frames:", frameIndices)

      const extractedFrames: string[] = []
      for (const index of frameIndices) {
        const frame = await extractFrame(index)
        extractedFrames.push(frame)
      }

      setFrames(extractedFrames)
      setIsExtracting(false)
      console.log("[v0] Frames extracted:", extractedFrames.length)
    }

    extractAllFrames()
  }, [videoLoaded, frameIndices, extractFrame, isExtracting])

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden video element for frame extraction */}
      <video ref={videoRef} src={videoUrl} crossOrigin="anonymous" className="hidden" preload="metadata" />

      {/* Timeline container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border border-border bg-card"
        style={{ height: trackHeight }}
      >
        {!videoLoaded && (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading video...</div>
          </div>
        )}

        {videoLoaded && frames.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-muted-foreground">Extracting frames...</div>
          </div>
        )}

        {/* Frame display */}
        <div className="flex h-full items-center gap-0.5">
          {frames.map((frame, index) => (
            <div
              key={`${frameIndices[index]}-${index}`}
              className="relative h-full flex-shrink-0"
              style={{
                height: trackHeight,
              }}
            >
              {frame && (
                <img
                  src={frame || "/placeholder.svg"}
                  alt={`Frame ${frameIndices[index]}`}
                  className="h-full w-auto object-cover"
                  style={{ height: trackHeight }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Frame info overlay */}
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs font-mono text-white">
          {visibleFrameCount} frames / {totalFrames} total
        </div>
      </div>
    </div>
  )
}
