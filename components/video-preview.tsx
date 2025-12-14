"use client"

import { useRef, useEffect, useState } from "react"

interface VideoClip {
  id: string
  src: string
  name: string
  start: number
  end: number
  duration: number
  offset: number
}

interface Subtitle {
  id?: string
  start: number
  end: number
  text: string
}

interface VideoPreviewProps {
  videoSrc?: string
  videoClips: VideoClip[]
  currentTime: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onLoadedMetadata: (duration: number) => void
  trackStart: number
  trackEnd: number
  onPlaybackEnd: () => void
  subtitles?: Subtitle[]
}

export function VideoPreview({
  videoSrc,
  videoClips,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onLoadedMetadata,
  trackStart,
  trackEnd,
  onPlaybackEnd,
  subtitles = [],
}: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const [videoDimensions, setVideoDimensions] = useState({ width: 1280, height: 720 })
  const [currentClip, setCurrentClip] = useState<VideoClip | null>(null)
  const [totalDuration, setTotalDuration] = useState(0)

  // 找到当前 active clip
  useEffect(() => {
    const activeClip = videoClips.find(
      (clip) => currentTime >= clip.offset && currentTime < clip.offset + clip.duration,
    )
    if (activeClip) {
      setCurrentClip(activeClip)
    } else if (videoSrc) {
      setCurrentClip({
        id: "default",
        src: videoSrc,
        name: "Default Video",
        start: 0,
        end: 0,
        duration: 0,
        offset: 0,
      })
    }
  }, [currentTime, videoClips, videoSrc])

  // 控制视频显示/隐藏 & 同步 currentTime
  useEffect(() => {
    if (!currentClip) return
    const currentVideo = videoRefs.current.get(currentClip.id)
    if (!currentVideo) return

    videoRefs.current.forEach((video, id) => {
      if (id !== currentClip.id) {
        video.style.visibility = "hidden"
        if (!video.paused) video.pause()
      }
    })

    currentVideo.style.visibility = "visible"

    const clipTime = Math.max(0, currentTime - currentClip.offset)
    const targetTime = currentClip.start + clipTime

    if (Math.abs(currentVideo.currentTime - targetTime) > 0.1) {
      currentVideo.currentTime = targetTime
      currentVideo.addEventListener(
        "seeked",
        () => {
          if (isPlaying) currentVideo.play().catch(console.error)
        },
        { once: true },
      )
    } else {
      if (isPlaying && currentVideo.paused) {
        currentVideo.play().catch(console.error)
      } else if (!isPlaying && !currentVideo.paused) {

        console.log("%c Line:105 🍤", "color:#e41a6a");
        currentVideo.pause()
      }
    }
  }, [currentClip, currentTime, isPlaying])

  // metadata 加载完成时计算总时长和视频尺寸
  useEffect(() => {
    const handleLoadedMetadata = (video: HTMLVideoElement, clip: VideoClip) => {
      const duration =
        videoClips.length > 0
          ? Math.max(...videoClips.map((c) => c.offset + c.duration))
          : video.duration || 0

      setTotalDuration(duration)
      onLoadedMetadata(duration)

      if (video.videoWidth && video.videoHeight) {
        setVideoDimensions({ width: video.videoWidth, height: video.videoHeight })
      }
    }

    const handleTimeUpdate = (video: HTMLVideoElement, clip: VideoClip) => {
      const elapsed = video.currentTime - clip.start
      const timelineTime = clip.offset + elapsed
      onTimeUpdate(timelineTime)

      if (timelineTime >= trackEnd) {
        console.log("%c Line:133 🍣 timelineTime >= trackEnd", "color:#93c0a4", timelineTime , trackEnd);

        console.log("%c Line:134 🍺", "color:#2eafb0");
        video.pause()
        onPlaybackEnd()
      }
    }

    videoRefs.current.forEach((video, id) => {
      const clip =
        videoClips.find((c) => c.id === id) ||
        ({
          id: "default",
          src: videoSrc || "",
          name: "Default Video",
          start: 0,
          end: 0,
          duration: 0,
          offset: 0,
        } as VideoClip)

      const metaHandler = () => handleLoadedMetadata(video, clip)
      const timeHandler = () => handleTimeUpdate(video, clip)

      video.addEventListener("loadedmetadata", metaHandler)
      video.addEventListener("timeupdate", timeHandler)

      return () => {
        video.removeEventListener("loadedmetadata", metaHandler)
        video.removeEventListener("timeupdate", timeHandler)
      }
    })
  }, [videoClips, videoSrc, onLoadedMetadata, onTimeUpdate, trackEnd, onPlaybackEnd])

  // 渲染字幕到 canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const currentSubtitle = subtitles.find(
        (sub) => currentTime >= sub.start && currentTime <= sub.end,
      )
      if (currentSubtitle) {
        ctx.font = "24px Arial, sans-serif"
        ctx.fillStyle = "#fff"
        ctx.strokeStyle = "#000"
        ctx.lineWidth = 2
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        const x = canvas.width / 2
        const y = canvas.height - 40
        ctx.strokeText(currentSubtitle.text, x, y)
        ctx.fillText(currentSubtitle.text, x, y)
      }
      if (isPlaying) requestAnimationFrame(renderFrame)
    }
    renderFrame()
  }, [currentTime, isPlaying, subtitles, videoDimensions])

  return (
    <div className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden">
      {/* 视频渲染区 */}
      <div className="relative w-full h-full">
        {videoClips.map((clip) => (
          <video
            key={clip.id}
            ref={(el) => {
              if (el) videoRefs.current.set(clip.id, el)
            }}
            src={clip.src}
            className="absolute inset-0 w-full h-full object-contain"
            muted
            playsInline
            style={{ visibility: "hidden" }}
          />
        ))}
        {videoSrc && (
          <video
            key="default"
            ref={(el) => {
              if (el) videoRefs.current.set("default", el)
            }}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-contain"
            muted
            playsInline
            style={{ visibility: "hidden" }}
          />
        )}
      </div>

      {/* 字幕 Canvas */}
      <canvas
        ref={canvasRef}
        width={videoDimensions.width}
        height={videoDimensions.height}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* 当前片段指示 */}
      {currentClip && currentClip.id !== "default" && (
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {currentClip.name}
        </div>
      )}
    </div>
  )
}
